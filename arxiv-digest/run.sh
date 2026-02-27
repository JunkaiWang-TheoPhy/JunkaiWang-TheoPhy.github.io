#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

python3 "${ROOT_DIR}/backend/server.py" --host 127.0.0.1 --port 8502 "$@"
