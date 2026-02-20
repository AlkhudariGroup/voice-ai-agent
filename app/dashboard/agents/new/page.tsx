"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

function getAuthHeaders(): HeadersInit {
  if (typeof window === "undefined") return {};
  const secret = sessionStorage.getItem("dashboard-secret");
  return secret ? { Authorization: `Bearer ${secret}` } : {};
}

export default function NewAgentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    storeName: "",
    storeUrl: "",
    storeDesc: "",
    customInstructions: "",
    policy: "Be helpful, friendly, and professional. When asked who you are or what you do, explain clearly that you are this store's assistant. Always stay in role and answer based on the store context.",
    usageLimit: 1000,
    settings: {
      memoryContextMessages: 8,
      temperature: 0.7,
      maxOutputTokens: 256,
      topP: 0.95,
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          ...form,
          settings: form.settings,
        }),
      });
      if (res.ok) {
        const agent = await res.json();
        router.push(`/dashboard/agents/${agent.id}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-[#0a0a0f] p-6">
      <div className="mx-auto max-w-2xl">
        <Link href="/dashboard/agents" className="text-yellow-400 hover:underline">
          ← Back to agents
        </Link>
        <h1 className="mt-6 mb-8 text-2xl font-bold text-white">Create New Agent</h1>
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setForm({
              name: "Zico Marisol",
              storeName: "Al Parts",
              storeUrl: "",
              storeDesc: "Auto spare parts store in Georgia. Over 20,000 products.",
              customInstructions: "You are Zico Marisol, a smart AI agent for Al Parts auto spare parts store in Georgia. You manage a catalog of 20,000+ products. You answer client questions about parts, help with orders, and communicate with the store owner. Your name is Zico Marisol. You work at Al Parts.",
              policy: "Be helpful and professional. When asked your name, say Zico Marisol. When asked where you work, say Al Parts – auto spare parts in Georgia. Never say you're a generic AI or don't have a name. Stay in role.",
              usageLimit: 1000,
              settings: form.settings,
            })}
            className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 px-4 py-2 text-sm text-yellow-400 hover:bg-yellow-500/20"
          >
            Load Zico Marisol demo
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-white/10 bg-white/5 p-6">
          <div>
            <label className="mb-2 block text-sm text-gray-400">Agent Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. My Store Assistant, Shop Helper, Support Bot"
              className="w-full rounded-lg border border-white/20 bg-black/30 px-4 py-3 text-white"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-gray-400">Store Name</label>
            <input
              type="text"
              value={form.storeName}
              onChange={(e) => setForm((f) => ({ ...f, storeName: e.target.value }))}
              placeholder="e.g. My Shop, E-Commerce Store, Online Store"
              className="w-full rounded-lg border border-white/20 bg-black/30 px-4 py-3 text-white"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-gray-400">Store URL</label>
            <input
              type="url"
              value={form.storeUrl}
              onChange={(e) => setForm((f) => ({ ...f, storeUrl: e.target.value }))}
              placeholder="https://example.com"
              className="w-full rounded-lg border border-white/20 bg-black/30 px-4 py-3 text-white"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-gray-400">Store Description</label>
            <input
              type="text"
              value={form.storeDesc}
              onChange={(e) => setForm((f) => ({ ...f, storeDesc: e.target.value }))}
              placeholder="e.g. E-commerce • Fashion & accessories • Electronics • Digital products"
              className="w-full rounded-lg border border-white/20 bg-black/30 px-4 py-3 text-white"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-gray-400">Custom Instructions</label>
            <textarea
              value={form.customInstructions}
              onChange={(e) => setForm((f) => ({ ...f, customInstructions: e.target.value }))}
              placeholder="Additional instructions for this store..."
              rows={3}
              className="w-full rounded-lg border border-white/20 bg-black/30 px-4 py-3 text-white"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-gray-400">Policy / Behavior</label>
            <textarea
              value={form.policy}
              onChange={(e) => setForm((f) => ({ ...f, policy: e.target.value }))}
              rows={3}
              className="w-full rounded-lg border border-white/20 bg-black/30 px-4 py-3 text-white"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-gray-400">Monthly Usage Limit (requests)</label>
            <input
              type="number"
              value={form.usageLimit}
              onChange={(e) => setForm((f) => ({ ...f, usageLimit: Number(e.target.value) || 1000 }))}
              min={100}
              className="w-full rounded-lg border border-white/20 bg-black/30 px-4 py-3 text-white"
            />
            <p className="mt-1 text-xs text-gray-500">Client pays based on usage. Renew resets counter.</p>
          </div>

          <div className="rounded-lg border border-white/10 bg-black/20 p-4">
            <h3 className="mb-4 text-sm font-semibold text-white">Memory & Quality (per client)</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-gray-500">Context (messages to remember)</label>
                <select
                  value={form.settings.memoryContextMessages}
                  onChange={(e) => setForm((f) => ({
                    ...f,
                    settings: { ...f.settings, memoryContextMessages: Number(e.target.value) },
                  }))}
                  className="w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-white"
                >
                  <option value={4}>4 (short)</option>
                  <option value={8}>8 (balanced)</option>
                  <option value={16}>16 (long)</option>
                  <option value={24}>24 (extended)</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">Temperature (creativity 0-1)</label>
                <input
                  type="number"
                  step="0.1"
                  min={0}
                  max={1}
                  value={form.settings.temperature}
                  onChange={(e) => setForm((f) => ({
                    ...f,
                    settings: { ...f.settings, temperature: Number(e.target.value) || 0.7 },
                  }))}
                  className="w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-white"
                />
                <p className="mt-1 text-xs text-gray-500">0.3=focused • 0.7=balanced • 1.0=creative</p>
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">Max response length (tokens)</label>
                <select
                  value={form.settings.maxOutputTokens}
                  onChange={(e) => setForm((f) => ({
                    ...f,
                    settings: { ...f.settings, maxOutputTokens: Number(e.target.value) },
                  }))}
                  className="w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-white"
                >
                  <option value={128}>128 (short)</option>
                  <option value={256}>256 (balanced)</option>
                  <option value={384}>384 (detailed)</option>
                  <option value={512}>512 (long)</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">Top P (diversity)</label>
                <input
                  type="number"
                  step="0.05"
                  min={0.8}
                  max={1}
                  value={form.settings.topP}
                  onChange={(e) => setForm((f) => ({
                    ...f,
                    settings: { ...f.settings, topP: Number(e.target.value) || 0.95 },
                  }))}
                  className="w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-white"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-yellow-500 py-3 font-semibold text-black hover:bg-yellow-400 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Agent"}
          </button>
        </form>
      </div>
    </div>
  );
}
