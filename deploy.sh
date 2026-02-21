#!/bin/bash
# Voice AI Agent - VPS Deployment Script
set -e

echo "=== Voice AI Agent - VPS Setup ==="

# Install Docker if not present
if ! command -v docker &> /dev/null; then
  echo "Installing Docker..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker 2>/dev/null || true
  systemctl start docker 2>/dev/null || true
fi

# Docker Compose (v2 plugin)
if ! docker compose version &> /dev/null 2>&1; then
  echo "Installing Docker Compose..."
  apt-get update -qq && apt-get install -y docker-compose-plugin 2>/dev/null || true
fi

# Create .env if missing
if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    cp .env.example .env
    echo "Created .env from .env.example - EDIT IT with your API keys!"
    echo "Run: nano .env"
    echo "Then run this script again."
    exit 1
  fi
fi

echo "Building and starting..."
docker compose build --no-cache
docker compose up -d

echo ""
echo "=== Done! ==="
IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "YOUR_SERVER_IP")
echo "App: http://${IP}:3000"
echo "Dashboard: http://${IP}:3000/dashboard"
echo ""
echo "Commands: docker compose logs -f | down | up -d"
