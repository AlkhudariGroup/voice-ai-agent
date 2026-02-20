"use client";

import { Memory } from "./types";

const STORAGE_KEY = "voice-ai-memory";

export function loadMemoryFromStorage(): Memory {
  if (typeof window === "undefined") {
    return { userProfile: {}, projects: [], notes: [], conversations: [] };
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { userProfile: {}, projects: [], notes: [], conversations: [] };
    const parsed = JSON.parse(stored) as Memory;
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

export function saveMemoryToStorage(memory: Memory): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
  } catch (e) {
    console.error("Failed to save memory:", e);
  }
}
