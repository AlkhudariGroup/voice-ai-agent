"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { VoiceSession } from "@/lib/dashboard-types";
import type { Agent } from "@/lib/dashboard-types";

function getAuthHeaders(): HeadersInit {
  if (typeof window === "undefined") return {};
  const secret = sessionStorage.getItem("dashboard-secret");
  return secret ? { Authorization: `Bearer ${secret}` } : {};
}

export default function VoiceConversationsPage() {
  const [sessions, setSessions] = useState<VoiceSession[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [storeFilter, setStoreFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const loadSessions = useCallback(() => {
    const params = new URLSearchParams();
    if (storeFilter) params.set("storeId", storeFilter);
    if (search.trim()) params.set("search", search.trim());
    fetch(`/api/dashboard/voice/sessions?${params}`, { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((d) => setSessions(d.sessions ?? []))
      .catch(() => setSessions([]));
  }, [storeFilter, search]);

  useEffect(() => {
    fetch("/api/dashboard/agents", { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((d) => setAgents(d.agents ?? []))
      .catch(() => setAgents([]));
  }, []);

  useEffect(() => {
    loadSessions();
    setLoading(false);
  }, [loadSessions]);

  const handlePlay = (s: VoiceSession) => {
    if (playingId === s.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }
    audioRef.current?.pause();
    setPlayingId(s.id);
    const audio = new Audio(s.audio_blob_url);
    audioRef.current = audio;
    audio.onended = () => setPlayingId(null);
    audio.play();
  };

  return (
    <div className="min-h-dvh bg-[#0a0a0f] p-6">
      <div className="mx-auto max-w-4xl">
        <Link href="/dashboard" className="text-yellow-400 hover:underline">
          ← Dashboard
        </Link>
        <h1 className="mt-6 mb-6 text-2xl font-bold text-white">Voice Conversations</h1>

        <div className="mb-6 flex flex-wrap gap-4">
          <select
            value={storeFilter}
            onChange={(e) => setStoreFilter(e.target.value)}
            className="rounded-lg border border-white/20 bg-black/30 px-4 py-2 text-white"
          >
            <option value="">All stores</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.storeName || a.name || a.id}
              </option>
            ))}
          </select>
          <input
            type="search"
            placeholder="Search transcript..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && loadSessions()}
            className="min-w-[200px] rounded-lg border border-white/20 bg-black/30 px-4 py-2 text-white placeholder-gray-500"
          />
          <button
            type="button"
            onClick={loadSessions}
            className="rounded-lg bg-yellow-500 px-4 py-2 font-semibold text-black hover:bg-yellow-400"
          >
            Search
          </button>
        </div>

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : sessions.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center text-gray-500">
            No voice sessions yet. Enable Voice Recording in agent settings and have customers use the embed.
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="rounded-xl border border-white/10 bg-white/5 p-4"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {new Date(s.timestamp).toLocaleString()} • {s.user_id.slice(0, 8)}… • {s.store_id.slice(0, 12)}…
                  </span>
                  <button
                    type="button"
                    onClick={() => handlePlay(s)}
                    className="rounded-lg bg-yellow-500/20 px-3 py-1.5 text-sm text-yellow-400 hover:bg-yellow-500/30"
                  >
                    {playingId === s.id ? "⏸ Pause" : "▶ Play"}
                  </button>
                </div>
                <p className="mb-1 text-sm text-blue-300">
                  <strong>User:</strong> {s.transcript || "(no transcript)"}
                </p>
                <p className="text-sm text-gray-300">
                  <strong>AI:</strong> {s.ai_response || "(no response)"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

