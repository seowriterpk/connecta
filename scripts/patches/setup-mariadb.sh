#!/bin/bash
# Restore MariaDB runtime after sandbox re-provision.
# - Extracts the tarball to /home/z/my-project/mysql-runtime
# - Initializes a fresh datadir
# - Starts mariadbd on 127.0.0.1:3306 (socket + TCP)
# - Creates db `gruposwhatsapp` + user `grupos` (matching src/lib/db.ts defaults)
exec 2>&1
set -e

ROOT=/home/z/my-project
MR=$ROOT/mysql-runtime
TARBALL=/tmp/mariadb.tar.gz
SOCKET=$MR/tmp/mysql.sock

mkdir -p "$MR/tmp" "$MR/data"

if [ ! -d "$MR/mariadb-11.8.6-linux-systemd-x86_64" ]; then
  echo "Extracting tarball..."
  tar -xzf "$TARBALL" -C "$MR"
fi

BIN=$MR/mariadb-11.8.6-linux-systemd-x86_64/bin
SCRIPTS=$MR/mariadb-11.8.6-linux-systemd-x86_64/scripts

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
