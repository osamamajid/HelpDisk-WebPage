#!/usr/bin/env bash
# IT Driver Library - backend entrypoint
# Waits for the database, then starts uvicorn.
set -euo pipefail

DB_HOST="${POSTGRES_HOST:-postgres}"
DB_PORT="${POSTGRES_PORT:-5432}"

echo "[entrypoint] Waiting for database ${DB_HOST}:${DB_PORT}..."
python - <<'PY'
import os, socket, sys, time
host = os.environ.get("POSTGRES_HOST", "postgres")
port = int(os.environ.get("POSTGRES_PORT", "5432"))
for _ in range(60):
    try:
        with socket.create_connection((host, port), timeout=2):
            print("[entrypoint] Database is reachable.")
            sys.exit(0)
    except OSError:
        time.sleep(2)
print("[entrypoint] Database not reachable; continuing anyway (app will retry on startup).")
PY

exec uvicorn app.main:app --host "${BACKEND_HOST:-0.0.0.0}" --port "${BACKEND_PORT:-8000}"
