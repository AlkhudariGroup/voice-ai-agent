import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { Memory } from "./types";

const DEFAULT_PATH = path.join(process.cwd(), "data", "memory.json");

function getMemoryPath(): string {
  return process.env.MEMORY_FILE_PATH ?? DEFAULT_PATH;
}

export async function loadMemoryFromFile(): Promise<Memory> {
  const filePath = getMemoryPath();
  try {
    const content = await readFile(filePath, "utf-8");
    const parsed = JSON.parse(content) as Memory;
    return {
      userProfile: parsed.userProfile ?? {},
      projects: Array.isArray(parsed.projects) ? parsed.projects : [],
      notes: Array.isArray(parsed.notes) ? parsed.notes : [],
      conversations: Array.isArray(parsed.conversations) ? parsed.conversations : [],
    };
  } catch {
    return { userProfile: {}, projects: [], notes: [], conversations: [] };
  }
}

export async function saveMemoryToFile(memory: Memory): Promise<void> {
  const filePath = getMemoryPath();
  const dir = path.dirname(filePath);
  await mkdir(dir, { recursive: true });
  await writeFile(filePath, JSON.stringify(memory, null, 2), "utf-8");
}
