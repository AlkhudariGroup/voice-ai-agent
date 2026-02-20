# Deploy to Vercel - Quick Steps

## 1. Login (run once)
```bash
npx vercel login
```
Follow the prompt (email or browser).

## 2. Deploy
```bash
cd /Volumes/DATA/Agent
npx vercel --prod
```

## 3. Add API Keys on Vercel
After deploy:
1. Go to https://vercel.com → Your project
2. **Settings** → **Environment Variables**
3. Add:
   - `OPENAI_API_KEY` = your key
   - `OPENAI_API_BASE` = `https://api.openai.com/v1`
4. **Redeploy** the project

Done! Your app will be live.
