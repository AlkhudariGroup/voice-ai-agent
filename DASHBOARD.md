# Voice AI Dashboard

Manage multiple Voice AI agents for different stores. Each agent has its own:
- Store config (name, URL, description)
- Custom instructions and policy
- Usage limit (requests per month)
- Conversation logs

## Access

- **URL:** `/dashboard`
- **Auth:** Set `DASHBOARD_SECRET` in `.env.local` to protect with password. Leave empty for no password.

## Flow

1. **Create Agent** → `/dashboard/agents/new`
   - Set store name, URL, description
   - Set custom instructions and policy
   - Set monthly usage limit (e.g. 1000 requests)

2. **Get Embed URL** → Copy from agent detail page
   - Example: `https://your-app.vercel.app/embed?agent=agent-xxx&site=Sal%20Parts&desc=...`
   - Add to your store as iframe

3. **Track Usage** → View on agent page
   - See used count vs limit
   - View % used (fair billing: more usage = more pay)

4. **Renew Usage** → Click "Renew Usage" when client pays
   - Resets used count to 0
   - Client gets full limit again

5. **View Conversations** → See what users asked and AI answered

## Env Vars

```bash
DASHBOARD_SECRET=your-password    # Optional, protects /dashboard
NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app  # For embed links
```

## Vercel Note

Dashboard data is stored in `/tmp/dashboard.json` on Vercel (ephemeral). For production with multiple instances, use a real database (Supabase, Vercel Postgres, etc.) and update `lib/dashboard-store.ts`.
