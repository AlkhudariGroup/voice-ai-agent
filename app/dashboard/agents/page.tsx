"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Agent } from "@/lib/dashboard-types";

const ACTIVE_THRESHOLD_MS = 5 * 60 * 1000;

function isClientActive(agent: Agent): boolean {
  const t = agent.lastActiveAt ? new Date(agent.lastActiveAt).getTime() : 0;
  return Date.now() - t < ACTIVE_THRESHOLD_MS;
}

function getAuthHeaders(): HeadersInit {
  if (typeof window === "undefined") return {};
  const secret = sessionStorage.getItem("dashboard-secret");
  return secret ? { Authorization: `Bearer ${secret}` } : {};
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = () =>
      fetch("/api/dashboard/agents", { headers: getAuthHeaders() })
        .then((r) => r.json())
        .then((d) => setAgents(d.agents ?? []))
        .catch(() => setAgents([]))
        .finally(() => setLoading(false));
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#0a0a0f] text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#0a0a0f] p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <Link href="/dashboard" className="text-yellow-400 hover:underline">
            ← Dashboard
          </Link>
          <Link
            href="/dashboard/agents/new"
            className="rounded-lg bg-yellow-500 px-4 py-2 font-semibold text-black hover:bg-yellow-400"
          >
            + New Agent
          </Link>
        </div>
        <h1 className="mb-6 text-2xl font-bold text-white">Agents</h1>
        {agents.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center text-gray-400">
            No agents yet.{" "}
            <Link href="/dashboard/agents/new" className="text-yellow-400 hover:underline">
              Create your first agent
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {agents.map((agent) => {
              const pct = agent.usageLimit > 0 ? Math.min(100, (agent.usedCount / agent.usageLimit) * 100) : 0;
              return (
                <Link
                  key={agent.id}
                  href={`/dashboard/agents/${agent.id}`}
                  className="block rounded-xl border border-white/10 bg-white/5 p-6 transition hover:border-yellow-500/50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex h-3 w-3 shrink-0 rounded-full ${isClientActive(agent) ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-gray-600"}`}
                        title={isClientActive(agent) ? "Client using app now" : "Inactive"}
                        aria-hidden
                      />
                      <div>
                        <h2 className="text-lg font-semibold text-white">{agent.name || agent.storeName || "Unnamed"}</h2>
                      <p className="text-sm text-gray-400">{agent.storeName} • {agent.storeUrl || "—"}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-medium ${pct >= 90 ? "text-red-400" : "text-green-400"}`}>
                        {agent.usedCount} / {agent.usageLimit}
                      </span>
                      <div className="mt-1 h-2 w-24 overflow-hidden rounded-full bg-black/30">
                        <div
                          className={`h-full ${pct >= 90 ? "bg-red-500" : "bg-yellow-500"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
