import { Memory } from "./types";

const SYSTEM_PROMPT = `You are a persistent, friendly AI assistant. You behave like a long-term partner who:
- Knows the user's projects and preferences
- Speaks casually and warmly
- Remembers context across conversations
- Helps with tasks, ideas, and planning
- Keeps responses concise when spoken (2-4 sentences typically)
- Updates memory when the user shares new info about projects or preferences`;

function buildContext(memory: Memory): string {
  const parts: string[] = [];
  if (memory.userProfile?.name) {
    parts.push(`User name: ${memory.userProfile.name}`);
  }
  if (Object.keys(memory.userProfile?.preferences ?? {}).length > 0) {
    parts.push(`Preferences: ${JSON.stringify(memory.userProfile!.preferences)}`);
  }
  if (memory.projects.length > 0) {
    parts.push(
      "Projects: " +
        memory.projects.map((p) => `${p.name}: ${p.description ?? ""}`).join("; ")
    );
  }
  if (memory.notes.length > 0) {
    parts.push(
      "Notes: " + memory.notes.slice(-5).map((n) => n.content).join("; ")
    );
  }
  if (memory.conversations.length > 0) {
    const last = memory.conversations[memory.conversations.length - 1];
    const recent = last.messages.slice(-4);
    parts.push(
      "Recent context: " +
        recent.map((m) => `${m.role}: ${m.content}`).join(" | ")
    );
  }
  return parts.join("\n") || "No prior context.";
}

export async function chatWithLLM(
  message: string,
  memory: Memory
): Promise<{ reply: string; updatedMemory: Memory }> {
  const baseUrl = process.env.OPENAI_API_BASE ?? "https://api.openai.com/v1";
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      reply:
        "Sorry, the API key isn't configured. Add OPENAI_API_KEY to your environment.",
      updatedMemory: memory,
    };
  }

  const context = buildContext(memory);
  const systemContent = `${SYSTEM_PROMPT}\n\nCurrent context:\n${context}`;

  const messages: { role: string; content: string }[] = [
    { role: "system", content: systemContent },
  ];

  if (memory.conversations.length > 0) {
    const last = memory.conversations[memory.conversations.length - 1];
    for (const m of last.messages.slice(-8)) {
      messages.push({ role: m.role, content: m.content });
    }
  }
  messages.push({ role: "user", content: message });

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages,
      max_tokens: 500,
    }),
  });

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

  const now = new Date().toISOString();
  const updatedMemory: Memory = { ...memory };
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
