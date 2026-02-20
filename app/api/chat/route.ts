import { NextRequest, NextResponse } from "next/server";
import { chatWithLLM } from "@/lib/llm";
import { loadMemoryFromFile, saveMemoryToFile } from "@/lib/memory-server";
import { Memory } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, memory: clientMemory, imageUrl } = body as {
      message?: string;
      memory?: Memory;
      imageUrl?: string;
    };

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid message" },
        { status: 400 }
      );
    }

    const serverMemory = await loadMemoryFromFile();
    const memory: Memory = {
      userProfile: clientMemory?.userProfile ?? serverMemory.userProfile,
      projects: clientMemory?.projects ?? serverMemory.projects,
      notes: clientMemory?.notes ?? serverMemory.notes,
      conversations: clientMemory?.conversations ?? serverMemory.conversations,
    };

    const userMessage = imageUrl
      ? `${message} [User attached image: ${imageUrl}]`
      : message;
    const { reply, updatedMemory } = await chatWithLLM(userMessage, memory);
    await saveMemoryToFile(updatedMemory);

    return NextResponse.json({ reply, updatedMemory });
  } catch (e) {
    console.error("Chat error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
