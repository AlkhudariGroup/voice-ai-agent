import { NextRequest, NextResponse } from "next/server";
import { getAgent } from "@/lib/dashboard-store";
import { DEFAULT_VOICE_SETTINGS } from "@/lib/dashboard-types";

export async function GET(req: NextRequest) {
  const agentId = req.nextUrl.searchParams.get("agentId");
  if (!agentId) {
    return NextResponse.json({ error: "agentId required" }, { status: 400 });
  }
  const agent = await getAgent(agentId);
  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }
  return NextResponse.json({
    voiceSettings: agent.voiceSettings ?? DEFAULT_VOICE_SETTINGS,
    storeName: agent.storeName ?? agent.name,
    voiceRecordingEnabled: !!agent.voiceRecordingEnabled,
    voiceUploadToken: agent.voiceUploadToken ?? undefined,
  });
}
