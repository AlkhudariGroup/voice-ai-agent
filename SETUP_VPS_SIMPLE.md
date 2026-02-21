# Setup VPS - Copy & Paste (5 minutes)

## Step 1: Connect

Open Terminal, run:
```
ssh root@76.13.179.65
```
Enter password when asked.

---

## Step 2: Install & Clone (copy-paste all, then Enter)

```bash
apt-get update -qq && apt-get install -y git curl
git clone https://github.com/AlkhudariGroup/voice-ai-agent.git /root/voice-agent
cd /root/voice-agent
```

---

## Step 3: Copy .env from your Mac

Open NEW Terminal window. Run:
```bash
scp /Volumes/DATA/Agent/.env.local root@76.13.179.65:/root/voice-agent/.env
```
Enter password.

---

## Step 4: Deploy (back in SSH window)

```bash
./deploy.sh
```
Wait 2-5 min.

---

## Step 5: Verify

```bash
./verify-vps.sh
```

---

## Done

- App: http://76.13.179.65:3000
- Dashboard: http://76.13.179.65:3000/dashboard

Firewall: `ufw allow 3000 && ufw reload`
