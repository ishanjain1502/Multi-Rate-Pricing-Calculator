#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$ROOT_DIR/server"
CLIENT_DIR="$ROOT_DIR/client"
SERVER_URL="${SERVER_URL:-http://localhost:3001}"
HEALTH_URL="$SERVER_URL/api/health"
MAX_WAIT_SECONDS=30

server_pid=""

cleanup() {
  if [[ -n "$server_pid" ]] && kill -0 "$server_pid" 2>/dev/null; then
    echo "Stopping server (pid $server_pid)..."
    kill "$server_pid" 2>/dev/null || true
    wait "$server_pid" 2>/dev/null || true
  fi
}

trap cleanup EXIT INT TERM

if [[ ! -d "$SERVER_DIR/node_modules" ]]; then
  echo "Installing server dependencies..."
  (cd "$SERVER_DIR" && npm install)
fi

if [[ ! -d "$CLIENT_DIR/node_modules" ]]; then
  echo "Installing client dependencies..."
  (cd "$CLIENT_DIR" && npm install)
fi

echo "Starting server..."
(cd "$SERVER_DIR" && npm run dev) &
server_pid=$!

echo "Waiting for server at $HEALTH_URL..."
for ((i = 1; i <= MAX_WAIT_SECONDS; i++)); do
  if curl -fsS "$HEALTH_URL" >/dev/null 2>&1; then
    echo "Server is ready."
    break
  fi

  if ! kill -0 "$server_pid" 2>/dev/null; then
    echo "Server process exited before becoming ready."
    exit 1
  fi

  sleep 1
done

if ! curl -fsS "$HEALTH_URL" >/dev/null 2>&1; then
  echo "Server did not become ready within ${MAX_WAIT_SECONDS}s."
  exit 1
fi

echo "Starting client..."
cd "$CLIENT_DIR"
npm run dev
