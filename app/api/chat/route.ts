import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;
export const runtime = "nodejs";
import { chatWithLLM } from "@/lib/llm";
import { loadMemoryFromFile, saveMemoryToFile } from "@/lib/memory-server";
import { Memory } from "@/lib/types";
import { getAgent } from "@/lib/dashboard-store";
import { getProductCount, searchProducts } from "@/lib/woocommerce";

async function fetchStoreData(agentId: string, message: string): Promise<string | undefined> {
  const agent = await getAgent(agentId);
  if (!agent?.woocommerce?.enabled) return undefined;
  const msg = message.toLowerCase();
  const productKeywords = /how many|count|products?|catalog|audi|stock|items?|أكثر كم|منتجات?|بضائع?/i;
  if (!productKeywords.test(msg)) return undefined;
  const config = {
    siteUrl: agent.woocommerce.siteUrl,
    consumerKey: agent.woocommerce.consumerKey,
    consumerSecret: agent.woocommerce.consumerSecret,
  };
  try {
    const count = await getProductCount(config);
    let data = `Total products in catalog: ${count}`;
    const searchMatch = msg.match(/(?:search|find|أبحث|ابحث|كم)\s+(.+?)(?:\?|$)/i) || msg.match(/(audi|سامسونج|iPhone|etc)/i);
    if (searchMatch) {
      const query = (searchMatch[1] || searchMatch[0] || "").trim();
      if (query.length >= 2) {
        const products = await searchProducts(config, query, 5);
        data += `\nSearch "${query}": ${products.length} found. Top: ${products.map((p) => `${p.name} ($${p.price})`).join("; ")}`;
      }
    }
    return data;
  } catch {
    return undefined;
  }
}

export async function POST(req: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const { message, memory: clientMemory, imageUrl, siteContext, agentId } = (body ?? {}) as {
      message?: string;
      memory?: Memory;
      imageUrl?: string;
      siteContext?: { siteName?: string; siteDesc?: string; customInstructions?: string; policy?: string };
      agentId?: string;
    };

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid message" },
        { status: 400 }
      );
    }

    let siteCtx: { siteName?: string; siteDesc?: string; customInstructions?: string; policy?: string } | undefined = siteContext;
    if (agentId) {
      try {
        const { getAgent, incrementAgentUsage, logConversation } = await import("@/lib/dashboard-store");
        const agent = await getAgent(agentId);
        if (agent) {
          if (agent.usedCount >= agent.usageLimit) {
            return NextResponse.json(
              { error: "Usage limit reached. Please contact the store owner to renew." },
              { status: 429 }
            );
          }
          const place = agent.storeName || agent.name || "this place";
          siteCtx = {
            siteName: agent.name ? `${agent.name} for ${place}` : place,
            siteDesc: agent.storeDesc || `You work at ${place}. Help customers and answer their questions.`,
            customInstructions: agent.customInstructions ?? undefined,
            policy: agent.policy ?? undefined,
          };
        }
      } catch (e) {
        console.warn("Dashboard agent lookup failed:", e);
      }
    }

    const serverMemory = await loadMemoryFromFile();
    const memory: Memory = {
      userProfile: clientMemory?.userProfile ?? serverMemory.userProfile,
      projects: clientMemory?.projects ?? serverMemory.projects,
      notes: clientMemory?.notes ?? serverMemory.notes,
      conversations: clientMemory?.conversations ?? serverMemory.conversations,
    };

    const userMessage = imageUrl
      ? `${message} [User attached image: ${imageUrl}]`
      : message;
    const storeData = agentId ? await fetchStoreData(agentId, message) : undefined;
    const { reply, updatedMemory } = await chatWithLLM(userMessage, memory, siteCtx, storeData);

    if (agentId) {
      try {
        const { incrementAgentUsage, logConversation } = await import("@/lib/dashboard-store");
        await incrementAgentUsage(agentId);
        await logConversation(agentId, message, reply);
      } catch (e) {
        console.warn("Dashboard logging failed:", e);
      }
    }
    await saveMemoryToFile(updatedMemory);

    return NextResponse.json({ reply, updatedMemory });
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    console.error("Chat API error:", err.message, err.stack);
    const body: { error: string; details?: string } = { error: "Internal server error" };
    if (process.env.NODE_ENV !== "production") body.details = err.message;
    return NextResponse.json(body, { status: 500 });
  }
}
