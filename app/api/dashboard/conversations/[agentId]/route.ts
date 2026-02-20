import { NextRequest, NextResponse } from "next/server";
import { getConversationsByAgent } from "@/lib/dashboard-store";

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.DASHBOARD_SECRET;
  if (!secret) return true;
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${secret}` || auth === secret;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  if (!isAuthorized(_req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { agentId } = await params;
  const conversations = await getConversationsByAgent(agentId);
  return NextResponse.json({ conversations });
}
