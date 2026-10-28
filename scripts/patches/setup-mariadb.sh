#!/bin/bash
# Restore MariaDB runtime after sandbox re-provision.
# - Extracts the tarball (/tmp/mariadb.tar.gz, any 11.x version) to
#   /home/z/my-project/mysql-runtime
# - Initializes a fresh datadir
# - Starts mariadbd on 127.0.0.1:3306 (socket + TCP)
# - Creates db `gruposwhatsapp` + user `grupos` (matching src/lib/db.ts defaults)
#
# FAST TARBALL DOWNLOAD (mirror.netcologne.de + 8 parallel range chunks,
# ~7 MB/s vs ~70 KB/s single-stream — see worklog.md for the full runbook):
#   URL="https://mirror.netcologne.de/mariadb/mariadb-11.4.13/bintar-linux-systemd-x86_64/mariadb-11.4.13-linux-systemd-x86_64.tar.gz"
#   SIZE=$(curl -sI "$URL" | grep -i content-length | tr -d '\r' | awk '{print $2}')
#   CHUNK=$((SIZE/8)); for i in 0 1 2 3 4 5 6 7; do
#     s=$((i*CHUNK)); e=$(((i+1)*CHUNK-1)); [ $i -eq 7 ] && e=$((SIZE-1))
#     curl -s --retry 5 --retry-all-errors -r ${s}-${e} -o part_$i.bin "$URL" &
#   done; wait; cat part_*.bin > /tmp/mariadb.tar.gz && rm -f part_*.bin
exec 2>&1
set -e

ROOT=/home/z/my-project
MR=$ROOT/mysql-runtime
TARBALL=/tmp/mariadb.tar.gz
SOCKET=$MR/tmp/mysql.sock

mkdir -p "$MR/tmp" "$MR/data"

# Auto-detect the extracted version dir (tarball version may change)
DIST=$(ls -d "$MR"/mariadb-*-linux-* 2>/dev/null | head -1)

if [ -z "$DIST" ]; then
  echo "Extracting tarball..."
  tar -xzf "$TARBALL" -C "$MR"
  DIST=$(ls -d "$MR"/mariadb-*-linux-* 2>/dev/null | head -1)
fi

BIN=$DIST/bin
SCRIPTS=$DIST/scripts

# Fresh datadir (idempotent: only init when empty)
if [ ! -d "$MR/data/mysql" ]; then
  echo "Initializing data directory..."
  "$SCRIPTS/mariadb-install-db" \
    --datadir="$MR/data" \
    --auth-root-authentication-method=normal \
    --skip-test-db >/dev/null
fi

echo "Starting mariadbd..."
(
  setsid bash -c "
    cd '$MR'
    '$BIN/mariadbd' \
      --datadir='$MR/data' \
      --socket='$SOCKET' \
      --port=3306 \
      --bind-address=127.0.0.1 \
      --skip-networking=0 \
      --pid-file='$MR/tmp/mysqld.pid' \
      --log-error='$MR/tmp/mysqld.err'
  " </dev/null > "$MR/tmp/mysqld-boot.log" 2>&1 &
)

# Wait for socket to be ready
for i in $(seq 1 60); do
  if [ -S "$SOCKET" ]; then
    echo "MariaDB is up (attempt $i)."
    break
  fi
  sleep 1
done
[ -S "$SOCKET" ] || { echo "FATAL: socket never appeared"; tail -20 "$MR/tmp/mysqld.err"; exit 1; }

M="$BIN/mariadb -u root -S $SOCKET"

echo "Creating database + user..."
$M -e "CREATE DATABASE IF NOT EXISTS \`gruposwhatsapp\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
$M -e "CREATE USER IF NOT EXISTS 'grupos'@'127.0.0.1' IDENTIFIED BY '';"
$M -e "CREATE USER IF NOT EXISTS 'grupos'@'localhost' IDENTIFIED BY '';"
$M -e "GRANT ALL PRIVILEGES ON \`gruposwhatsapp\`.* TO 'grupos'@'127.0.0.1';"
$M -e "GRANT ALL PRIVILEGES ON \`gruposwhatsapp\`.* TO 'grupos'@'localhost';"
$M -e "FLUSH PRIVILEGES;"

echo "Verifying TCP connection as grupos..."
$BIN/mariadb -u grupos -h 127.0.0.1 -P 3306 gruposwhatsapp -e "SELECT VERSION() AS v;"

echo "MARIADB-SETUP-DONE"
