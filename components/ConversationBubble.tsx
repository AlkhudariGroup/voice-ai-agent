"use client";

interface ConversationBubbleProps {
  role: "user" | "assistant";
  content: string;
}

export function ConversationBubble({ role, content }: ConversationBubbleProps) {
  return (
    <div
      className={`animate-slideUp flex justify-${role === "user" ? "end" : "start"} mb-3`}
    >
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          role === "user"
            ? "bg-indigo-600 text-white"
            : "bg-white/10 text-gray-100 backdrop-blur"
        }`}
      >
        <p className="text-sm leading-relaxed">{content}</p>
      </div>
    </div>
  );
}
