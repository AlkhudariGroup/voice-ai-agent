import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getAgent } from "@/lib/dashboard-store";
import { addVoiceSession } from "@/lib/voice-sessions-store";
import type { VoiceSession } from "@/lib/dashboard-types";

async function isUploadAuthorized(req: NextRequest, storeId: string): Promise<boolean> {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  const agent = await getAgent(storeId);
  if (agent?.voiceUploadToken && token === agent.voiceUploadToken) return true;
  const secret = process.env.DASHBOARD_SECRET;
  if (secret && (auth === `Bearer ${secret}` || auth === secret)) return true;
  return false;
}

export async function POST(req: NextRequest) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }
  const store_id = formData.get("store_id") as string | null;
  if (!store_id) {
    return NextResponse.json({ error: "store_id required" }, { status: 400 });
  }
  if (!(await isUploadAuthorized(req, store_id))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "BLOB_READ_WRITE_TOKEN not configured" }, { status: 500 });
  }

  try {
    const audio = formData.get("audio") as Blob | null;
    const store_id = formData.get("store_id") as string | null;
    const user_id = formData.get("user_id") as string | null;
    const transcript = (formData.get("transcript") as string) ?? "";
    const ai_response = (formData.get("ai_response") as string) ?? "";
    const consent_given = formData.get("consent_given") === "true";

    if (!audio || !store_id || !user_id) {
      return NextResponse.json(
        { error: "audio, store_id, user_id required" },
        { status: 400 }
      );
    }

    const agent = await getAgent(store_id);
    if (!agent?.voiceRecordingEnabled) {
      return NextResponse.json({ error: "Voice recording not enabled" }, { status: 403 });
    }

    const session_id = crypto.randomUUID();
    const blobPath = `stores/${store_id}/users/${user_id}/voice/${session_id}.webm`;

    const blob = await put(blobPath, audio, {
      access: "public",
      contentType: "audio/webm",
    });

    const session: VoiceSession = {
      id: session_id,
      user_id,
      store_id,
      audio_blob_url: blob.url,
      transcript,
      ai_response,
      timestamp: new Date().toISOString(),
      consent_given,
    };

    await addVoiceSession(session);

    return NextResponse.json({ ok: true, id: session_id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
