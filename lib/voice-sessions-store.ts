import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import type { VoiceSession } from "./dashboard-types";

const FILENAME = "voice-sessions.json";

function getStorePath(): string {
  return process.env.VERCEL
    ? path.join("/tmp", FILENAME)
    : path.join(process.cwd(), "data", FILENAME);
}

interface VoiceSessionsData {
  sessions: VoiceSession[];
}

async function loadData(): Promise<VoiceSessionsData> {
  try {
    const filePath = getStorePath();
    const dir = path.dirname(filePath);
    await mkdir(dir, { recursive: true });
    const content = await readFile(filePath, "utf-8");
    return JSON.parse(content);
  } catch {
    return { sessions: [] };
  }
}

async function saveData(data: VoiceSessionsData): Promise<void> {
  try {
    const filePath = getStorePath();
    const dir = path.dirname(filePath);
    await mkdir(dir, { recursive: true });
    await writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    console.warn("Voice sessions save failed:", e);
  }
}

export async function addVoiceSession(session: VoiceSession): Promise<void> {
  const data = await loadData();
  data.sessions.push(session);
  if (data.sessions.length > 50000) {
    data.sessions = data.sessions.slice(-25000);
  }
  await saveData(data);
}

export async function getVoiceSessionsByStore(storeId: string, search?: string): Promise<VoiceSession[]> {
  const data = await loadData();
  let sessions = data.sessions.filter((s) => s.store_id === storeId);
  if (search?.trim()) {
    const q = search.toLowerCase();
    sessions = sessions.filter(
      (s) =>
        s.transcript.toLowerCase().includes(q) ||
        s.ai_response.toLowerCase().includes(q) ||
        s.user_id.toLowerCase().includes(q)
    );
  }
  return sessions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function getAllVoiceSessions(search?: string): Promise<VoiceSession[]> {
  const data = await loadData();
  let sessions = data.sessions;
  if (search?.trim()) {
    const q = search.toLowerCase();
    sessions = sessions.filter(
      (s) =>
        s.transcript.toLowerCase().includes(q) ||
        s.ai_response.toLowerCase().includes(q) ||
        s.user_id.toLowerCase().includes(q) ||
        s.store_id.toLowerCase().includes(q)
    );
  }
  return sessions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
