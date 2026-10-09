#!/bin/bash
# Daemon launcher for the local MariaDB server (sandbox dev).
# Double-fork → reparented to init → survives the bash-tool shell exit.
#
# Usage: ./start-mariadb.sh
# Logs:  /home/z/my-project/mysql-runtime/mariadb.log

RUNTIME_DIR=/home/z/my-project/mysql-runtime
MARIADB_BIN=$RUNTIME_DIR/mariadb-11.8.6-linux-systemd-x86_64/bin/mariadbd

if ! [ -x "$MARIADB_BIN" ]; then
  echo "❌ mariadbd not found at $MARIADB_BIN"
  exit 1
fi

# Already running? Don't start a second instance.
if pgrep -f "bin/mariadbd" > /dev/null 2>&1; then
  echo "mariadbd already running:"
  pgrep -f "bin/mariadbd" | head -1
  exit 0
fi

mkdir -p "$RUNTIME_DIR/data" "$RUNTIME_DIR/tmp"

# Double-fork daemonization
(
  setsid bash -c "
    cd $RUNTIME_DIR
    exec $MARIADB_BIN --defaults-file=$RUNTIME_DIR/my.cnf --user=z
  " </dev/null >>$RUNTIME_DIR/mariadb.log 2>&1 &
  exit 0
) </dev/null >/dev/null 2>&1 &
disown

# Wait for the socket/port to accept connections (up to 30s)
for i in $(seq 1 30); do
  if $RUNTIME_DIR/mariadb-11.8.6-linux-systemd-x86_64/bin/mariadb-admin \
      --socket=$RUNTIME_DIR/tmp/mysql.sock -u root ping 2>/dev/null | grep -q "alive"; then
    echo "MariaDB is alive on 127.0.0.1:3306"
    exit 0
  fi
  sleep 1
done

echo "⚠️ MariaDB did not respond within 30s — check $RUNTIME_DIR/mariadb.log"
exit 1
