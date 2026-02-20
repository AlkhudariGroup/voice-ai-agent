import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import type { Agent, ConversationLog, DashboardData } from "./dashboard-types";
import { DEFAULT_AGENT_SETTINGS } from "./dashboard-types";

const FILENAME = "dashboard.json";

function getStorePath(): string {
  return process.env.VERCEL
    ? path.join("/tmp", FILENAME)
    : path.join(process.cwd(), "data", FILENAME);
}

async function loadData(): Promise<DashboardData> {
  try {
    const filePath = getStorePath();
    const dir = path.dirname(filePath);
    await mkdir(dir, { recursive: true });
    const content = await readFile(filePath, "utf-8");
    const data = JSON.parse(content) as DashboardData;
    return {
      agents: data.agents ?? [],
      conversations: data.conversations ?? [],
    };
  } catch {
    return { agents: [], conversations: [] };
  }
}

async function saveData(data: DashboardData): Promise<void> {
  try {
    const filePath = getStorePath();
    const dir = path.dirname(filePath);
    await mkdir(dir, { recursive: true });
    await writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    console.warn("Dashboard save failed:", e);
  }
}

export async function getAgents(): Promise<Agent[]> {
  const data = await loadData();
  return data.agents;
}

export async function getAgent(id: string): Promise<Agent | null> {
  const agents = await getAgents();
  return agents.find((a) => a.id === id) ?? null;
}

export async function createAgent(
  agent: Omit<Agent, "id" | "createdAt" | "embedUrl" | "usedCount">
): Promise<Agent> {
  const data = await loadData();
  const id = `agent-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://voice-ai-agent-pearl.vercel.app";
  const newAgent: Agent = {
    ...agent,
    id,
    usedCount: 0,
    createdAt: new Date().toISOString(),
    embedUrl: `${baseUrl}/embed?agent=${id}&site=${encodeURIComponent(agent.storeName)}&desc=${encodeURIComponent(agent.storeDesc)}`,
    settings: { ...DEFAULT_AGENT_SETTINGS, ...agent.settings },
  };
  data.agents.push(newAgent);
  await saveData(data);
  return newAgent;
}

export async function updateAgent(
  id: string,
  updates: Partial<Omit<Agent, "id" | "createdAt">>
): Promise<Agent | null> {
  const data = await loadData();
  const i = data.agents.findIndex((a) => a.id === id);
  if (i < 0) return null;
  data.agents[i] = { ...data.agents[i], ...updates };
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://voice-ai-agent-pearl.vercel.app";
  data.agents[i].embedUrl = `${baseUrl}/embed?agent=${id}&site=${encodeURIComponent(data.agents[i].storeName)}&desc=${encodeURIComponent(data.agents[i].storeDesc)}`;
  await saveData(data);
  return data.agents[i];
}

export async function renewAgentUsage(id: string): Promise<Agent | null> {
  return updateAgent(id, { usedCount: 0 });
}

export async function incrementAgentUsage(id: string): Promise<void> {
  const data = await loadData();
  const agent = data.agents.find((a) => a.id === id);
  if (agent) {
    agent.usedCount = (agent.usedCount ?? 0) + 1;
    agent.lastActiveAt = new Date().toISOString();
    await saveData(data);
  }
}

export async function logConversation(
  agentId: string,
  userMessage: string,
  assistantReply: string
): Promise<void> {
  const data = await loadData();
  data.conversations.push({
    id: `conv-${Date.now()}`,
    agentId,
    userMessage,
    assistantReply,
    timestamp: new Date().toISOString(),
  });
  if (data.conversations.length > 10000) {
    data.conversations = data.conversations.slice(-5000);
  }
  await saveData(data);
}

export async function getConversationsByAgent(agentId: string): Promise<ConversationLog[]> {
  const data = await loadData();
  return data.conversations.filter((c) => c.agentId === agentId).reverse();
}
