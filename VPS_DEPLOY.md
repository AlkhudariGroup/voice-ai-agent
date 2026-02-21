# Voice AI Agent - VPS Deployment

## Quick Start (after SSH)

```bash
# 1. Clone your repo (replace with your GitHub URL)
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git voice-agent
cd voice-agent

# 2. Create .env (copy from your local .env.local or edit .env.example)
nano .env
# Add: GEMINI_API_KEY, OPENAI_API_KEY, DASHBOARD_SECRET, etc.

# 3. Run deployment
chmod +x deploy.sh
./deploy.sh
```

## Manual Steps

```bash
# Install Docker (if not installed)
curl -fsSL https://get.docker.com | sh

# Build and run
docker compose build --no-cache
docker compose up -d

# View logs
docker compose logs -f
```

## Required .env variables

- USE_GEMINI=true
- GEMINI_API_KEY=...
- OPENAI_API_KEY=...
- DASHBOARD_SECRET=... (for /dashboard)
- BLOB_READ_WRITE_TOKEN=... (optional, for voice recording)
- NEXT_PUBLIC_BASE_URL=http://YOUR_VPS_IP:3000

## Access

- App: http://YOUR_VPS_IP:3000
- Dashboard: http://YOUR_VPS_IP:3000/dashboard
