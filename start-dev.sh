#!/bin/bash
# Daemon launcher for the Next.js dev server.
# Uses double-fork so the server is reparented to init (PID 1) and
# survives the bash-tool shell exit.
#
# Usage: ./start-dev.sh
# Logs:  /home/z/my-project/dev.log
# PID:   /home/z/my-project/dev.pid

cd /home/z/my-project

# Kill any stale instances first
pkill -9 -f "next-server" 2>/dev/null
pkill -9 -f "next dev" 2>/dev/null
sleep 1

# Keep the .next cache when possible (preserves compiled routes, avoids
# re-compile memory spikes). Remove only the stale PID marker.
# If the cache is corrupt, delete .next manually and re-run.

# Double-fork daemonization
(
  # First fork — child of the calling shell
  setsid bash -c '
    # Second fork — reparented to init after first-fork exits
    cd /home/z/my-project
    export NODE_OPTIONS='--max-old-space-size=1792'
    exec ./node_modules/.bin/next dev -p 3000 --webpack
  ' </dev/null >/home/z/my-project/dev.log 2>&1 &
  # First fork exits immediately, orphaning the second fork → init adopts it
  exit 0
) </dev/null >/dev/null 2>&1 &
disown

# Give the caller the (approximate) PID for logging
sleep 3
NEXT_PID=$(pgrep -f "next-server" 2>/dev/null | head -1)
[ -n "$NEXT_PID" ] && echo "$NEXT_PID" > /home/z/my-project/dev.pid
echo "dev server PID: $NEXT_PID"
exit 0
