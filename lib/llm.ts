import { Memory } from "./types";
import { buildSystemPrompt } from "./ecommerco-identity";

const USE_GEMINI = process.env.USE_GEMINI === "true";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

function buildContext(memory: Memory, storeData?: string): string {
  const parts: string[] = [];
  if (storeData) {
    parts.push(`Store data (use this for product/catalog questions):\n${storeData}`);
  }
  if (memory.userProfile?.name) {
    parts.push(`User name: ${memory.userProfile.name}`);
  }
  if (Object.keys(memory.userProfile?.preferences ?? {}).length > 0) {
    parts.push(`Preferences: ${JSON.stringify(memory.userProfile!.preferences)}`);
  }
  if (Array.isArray(memory.projects) && memory.projects.length > 0) {
    parts.push(
      "Projects: " +
        memory.projects.map((p) => `${p.name}: ${p.description ?? ""}`).join("; ")
    );
  }
  if (Array.isArray(memory.notes) && memory.notes.length > 0) {
    parts.push(
      "Notes: " + memory.notes.slice(-5).map((n) => n.content).join("; ")
    );
  }
  if (memory.conversations?.length > 0) {
    const last = memory.conversations[memory.conversations.length - 1];
    const recent = Array.isArray(last?.messages) ? last.messages.slice(-4) : [];
    parts.push(
      "Recent context: " +
        recent.map((m) => `${m.role}: ${m.content}`).join(" | ")
    );
  }
  return parts.join("\n") || "No prior context.";
}

function getSystemPrompt(siteContext?: { siteName?: string; siteDesc?: string; customInstructions?: string; policy?: string }): string {
  return buildSystemPrompt(siteContext ?? { siteName: "this store" });
}

async function chatWithGemini(
  message: string,
  memory: Memory,
  siteContext?: { siteName?: string; siteDesc?: string; customInstructions?: string; policy?: string },
  storeData?: string
): Promise<{ reply: string; updatedMemory: Memory }> {
  if (!GEMINI_API_KEY) {
    return {
      reply: "Add GEMINI_API_KEY to .env.local. Get it from https://aistudio.google.com/apikey",
      updatedMemory: memory,
    };
  }

  const context = buildContext(memory, storeData);
  const systemContent = `${getSystemPrompt(siteContext)}\n\nCurrent context:\n${context}`;

  const contents: { role: string; parts: { text: string }[] }[] = [];
  if (memory.conversations.length > 0) {
    const last = memory.conversations[memory.conversations.length - 1];
    for (const m of last.messages.slice(-16)) {
      contents.push({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      });
    }
  }
  contents.push({ role: "user", parts: [{ text: message }] });

  const models = ["gemini-1.5-flash", "gemini-2.0-flash"];
  let lastErr = "";
  for (const model of models) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000);
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemContent }] },
            contents,
            generationConfig: {
              maxOutputTokens: 384,
              temperature: 0.7,
              topP: 0.95,
            },
          }),
          signal: controller.signal,
        }
      ).finally(() => clearTimeout(timeoutId));
      if (!res.ok) {
        lastErr = await res.text();
        continue;
      }
      const data = (await res.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      const reply = text?.trim() ?? "I didn't get a response.";
      return { reply, updatedMemory: memory };
    } catch (e) {
      lastErr = e instanceof Error ? e.message : String(e);
    }
  }
  if (OPENAI_API_KEY) {
    return chatWithOpenAI(message, memory, siteContext, storeData);
  }
  return {
    reply: `Sorry, connection failed. Try again. (${lastErr.slice(0, 80)})`,
    updatedMemory: memory,
  };
}

async function chatWithOpenAI(
  message: string,
  memory: Memory,
  siteContext?: { siteName?: string; siteDesc?: string; customInstructions?: string; policy?: string },
  storeData?: string
): Promise<{ reply: string; updatedMemory: Memory }> {
  const baseUrl = process.env.OPENAI_API_BASE ?? "https://api.openai.com/v1";
  const isLocal = baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1");
  const model = process.env.OPENAI_API_MODEL ?? (isLocal ? "llama2" : "gpt-4o-mini");
  if (!isLocal && !OPENAI_API_KEY) {
    return {
      reply: "Add OPENAI_API_KEY to .env.local (or use Ollama: OPENAI_API_BASE=http://localhost:11434/v1)",
      updatedMemory: memory,
    };
  }

  const context = buildContext(memory, storeData);
  const systemContent = `${getSystemPrompt(siteContext)}\n\nCurrent context:\n${context}`;

  const messages: { role: string; content: string }[] = [
    { role: "system", content: systemContent },
  ];
  if (memory.conversations.length > 0) {
    const last = memory.conversations[memory.conversations.length - 1];
    for (const m of last.messages.slice(-16)) {
      messages.push({ role: m.role, content: m.content });
    }
  }
  messages.push({ role: "user", content: message });

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (OPENAI_API_KEY) headers.Authorization = `Bearer ${OPENAI_API_KEY}`;
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 512,
        temperature: 0.8,
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    if (!res.ok) {
      const err = await res.text();
      return {
        reply: `Sorry, I couldn't process that. Error: ${err.slice(0, 200)}`,
        updatedMemory: memory,
      };
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const reply = data.choices?.[0]?.message?.content?.trim() ?? "I didn't get a response.";
    return { reply, updatedMemory: memory };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      reply: `Sorry, connection failed. Try again. (${msg.slice(0, 80)})`,
      updatedMemory: memory,
    };
  }
}

export async function chatWithLLM(
  message: string,
  memory: Memory,
  siteContext?: { siteName?: string; siteDesc?: string; customInstructions?: string; policy?: string },
  storeData?: string
): Promise<{ reply: string; updatedMemory: Memory }> {
  const provider = USE_GEMINI && GEMINI_API_KEY ? "gemini" : "openai";
  const result =
    provider === "gemini"
      ? await chatWithGemini(message, memory, siteContext, storeData)
      : await chatWithOpenAI(message, memory, siteContext, storeData);

  const now = new Date().toISOString();
  const updatedMemory: Memory = { ...memory };
  const { reply } = result;
  if (updatedMemory.conversations.length === 0) {
    updatedMemory.conversations.push({
      id: crypto.randomUUID(),
      messages: [],
      startedAt: now,
      updatedAt: now,
    });
  }
  const convo = updatedMemory.conversations[updatedMemory.conversations.length - 1];
  convo.messages.push({ role: "user", content: message, timestamp: now });
  convo.messages.push({ role: "assistant", content: reply, timestamp: now });
  convo.updatedAt = now;
  if (convo.messages.length > 50) {
    convo.messages = convo.messages.slice(-50);
  }
  if (updatedMemory.conversations.length > 20) {
    updatedMemory.conversations = updatedMemory.conversations.slice(-20);
  }

  return { reply, updatedMemory };
}
