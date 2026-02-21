#!/bin/bash
# Run this ON THE VPS after deploy.sh to verify everything works
set -e
echo "=== Verification ==="
echo "1. Docker container running:"
docker compose ps
echo ""
echo "2. App responding:"
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 && echo " OK - Homepage" || echo " FAIL"
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/dashboard && echo " OK - Dashboard" || echo " FAIL"
echo ""
echo "3. If both return 200 OK, deployment is successful."
