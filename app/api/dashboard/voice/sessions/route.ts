import { NextRequest, NextResponse } from "next/server";
import { getVoiceSessionsByStore, getAllVoiceSessions } from "@/lib/voice-sessions-store";

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
  const storeId = req.nextUrl.searchParams.get("storeId");
  const search = req.nextUrl.searchParams.get("search") ?? "";

  try {
    const sessions = storeId
      ? await getVoiceSessionsByStore(storeId, search || undefined)
      : await getAllVoiceSessions(search || undefined);
    return NextResponse.json({ sessions });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
