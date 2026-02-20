# Upload to GitHub

Repo is committed locally. To push to GitHub:

## 1. Fix GitHub auth (if needed)
```bash
gh auth login
```
Follow the prompts.

## 2. Create repo and push
```bash
cd /Volumes/DATA/Agent
gh repo create voice-ai-agent --public --source=. --remote=origin --push
```

## Or manual (if no gh CLI):
1. Go to https://github.com/new
2. Create repo: `voice-ai-agent` (or your name)
3. Run:
```bash
cd /Volumes/DATA/Agent
git remote add origin https://github.com/YOUR_USERNAME/voice-ai-agent.git
git branch -M main
git push -u origin main
```
