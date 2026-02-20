#!/bin/bash
cd "$(dirname "$0")/.."
ulimit -n 10240 2>/dev/null || true
exec npm run dev
