import { NextRequest, NextResponse } from "next/server";
import { getAgents, createAgent } from "@/lib/dashboard-store";

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.DASHBOARD_SECRET;
  if (!secret) return true;
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${secret}` || auth === secret;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const agents = await getAgents();
  return NextResponse.json({ agents });
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const { name, storeName, storeUrl, storeDesc, customInstructions, policy, usageLimit, settings } = body;
    const agent = await createAgent({
      name: name || "New Agent",
      storeName: storeName || "",
      storeUrl: storeUrl || "",
      storeDesc: storeDesc || "",
      customInstructions: customInstructions || "",
      policy: policy || "Be helpful, friendly, and professional.",
      usageLimit: Number(usageLimit) || 1000,
      settings: settings ? {
        memoryContextMessages: Number(settings.memoryContextMessages) || 8,
        temperature: Number(settings.temperature) || 0.7,
        maxOutputTokens: Number(settings.maxOutputTokens) || 256,
        topP: Number(settings.topP) || 0.95,
      } : undefined,
    });
    return NextResponse.json(agent);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create agent" },
      { status: 500 }
    );
  }
}
