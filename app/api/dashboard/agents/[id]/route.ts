import { NextRequest, NextResponse } from "next/server";
import { getAgent, updateAgent } from "@/lib/dashboard-store";

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.DASHBOARD_SECRET;
  if (!secret) return true;
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${secret}` || auth === secret;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthorized(_req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const agent = await getAgent(id);
  if (!agent) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(agent);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json();
  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.storeName !== undefined) updates.storeName = body.storeName;
  if (body.storeUrl !== undefined) updates.storeUrl = body.storeUrl;
  if (body.storeDesc !== undefined) updates.storeDesc = body.storeDesc;
  if (body.customInstructions !== undefined) updates.customInstructions = body.customInstructions;
  if (body.policy !== undefined) updates.policy = body.policy;
  if (body.usageLimit !== undefined) updates.usageLimit = Number(body.usageLimit);
  if (body.settings !== undefined) {
    updates.settings = {
      memoryContextMessages: Number(body.settings.memoryContextMessages) || 8,
      temperature: Number(body.settings.temperature) || 0.7,
      maxOutputTokens: Number(body.settings.maxOutputTokens) || 256,
      topP: Number(body.settings.topP) || 0.95,
    };
  }
  if (body.voiceSettings !== undefined) updates.voiceSettings = body.voiceSettings;
  if (body.woocommerce !== undefined) updates.woocommerce = body.woocommerce;
  if (body.smtp !== undefined) updates.smtp = body.smtp;
  if (body.voiceRecordingEnabled !== undefined) {
    updates.voiceRecordingEnabled = Boolean(body.voiceRecordingEnabled);
    if (updates.voiceRecordingEnabled) {
      const agent = await getAgent(id);
      if (agent && !agent.voiceUploadToken) {
        updates.voiceUploadToken = `vu-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
      }
    }
  }
  const agent = await updateAgent(id, updates);
  if (!agent) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(agent);
}
