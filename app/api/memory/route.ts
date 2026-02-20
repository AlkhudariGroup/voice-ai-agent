import { NextRequest, NextResponse } from "next/server";
import { loadMemoryFromFile, saveMemoryToFile } from "@/lib/memory-server";
import { Memory } from "@/lib/types";

export async function GET() {
  try {
    const memory = await loadMemoryFromFile();
    return NextResponse.json(memory);
  } catch (e) {
    console.error("Memory GET error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const memory = body as Memory;

    if (
      !memory ||
      typeof memory.userProfile !== "object" ||
      !Array.isArray(memory.projects) ||
      !Array.isArray(memory.notes) ||
      !Array.isArray(memory.conversations)
    ) {
      return NextResponse.json(
        { error: "Invalid memory structure" },
        { status: 400 }
      );
    }

    await saveMemoryToFile(memory);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Memory POST error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
