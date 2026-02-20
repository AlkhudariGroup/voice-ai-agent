# Voice AI Agent

Production-ready PWA Voice AI Agent similar to ChatGPT voice mode.

## Stack

- Next.js 14 (App Router)
- TypeScript
- TailwindCSS
- PWA (manifest + service worker)
- Web Speech API
- OpenAI-compatible API

## Setup

1. Copy `.env.example` to `.env.local`
2. Set `OPENAI_API_KEY`
3. `npm install && npm run dev`

## Deploy (Vercel)

```bash
vercel
```

## Docker

```bash
docker build -t voice-ai-agent .
docker run -p 3000:3000 -e OPENAI_API_KEY=sk-xxx voice-ai-agent
```
