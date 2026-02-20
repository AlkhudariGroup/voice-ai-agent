"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { Agent, AgentSettings, VoiceSettings, WooCommerceConfig, SmtpConfig } from "@/lib/dashboard-types";
import { DEFAULT_AGENT_SETTINGS, DEFAULT_VOICE_SETTINGS } from "@/lib/dashboard-types";
import type { ConversationLog } from "@/lib/dashboard-types";

function getAuthHeaders(): HeadersInit {
  if (typeof window === "undefined") return {};
  const secret = sessionStorage.getItem("dashboard-secret");
  return secret ? { Authorization: `Bearer ${secret}` } : {};
}

const emptyWoo: WooCommerceConfig = { siteUrl: "", consumerKey: "", consumerSecret: "", enabled: false };
const emptySmtp: SmtpConfig = { host: "", port: 587, user: "", password: "", tls: true, fromEmail: "", fromName: "" };

export default function AgentDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [agent, setAgent] = useState<Agent | null>(null);
  const [conversations, setConversations] = useState<ConversationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [editSettings, setEditSettings] = useState<AgentSettings>(DEFAULT_AGENT_SETTINGS);
  const [editVoice, setEditVoice] = useState<VoiceSettings>(DEFAULT_VOICE_SETTINGS);
  const [editWoo, setEditWoo] = useState<WooCommerceConfig>(emptyWoo);
  const [editSmtp, setEditSmtp] = useState<SmtpConfig>(emptySmtp);
  const [editVoiceRecording, setEditVoiceRecording] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch(`/api/dashboard/agents/${id}`, { headers: getAuthHeaders() }),
      fetch(`/api/dashboard/conversations/${id}`, { headers: getAuthHeaders() }),
    ])
      .then(([ar, cr]) => Promise.all([ar.json(), cr.json()]))
      .then(([ad, cd]) => {
        const a = ad.error ? null : ad;
        setAgent(a);
        setConversations(cd.conversations ?? []);
        if (a?.settings) setEditSettings(a.settings);
        if (a?.voiceSettings) setEditVoice(a.voiceSettings);
        if (a?.woocommerce) setEditWoo(a.woocommerce);
        if (a?.smtp) setEditSmtp(a.smtp);
        setEditVoiceRecording(!!a?.voiceRecordingEnabled);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleSaveSettings = async () => {
    const res = await fetch(`/api/dashboard/agents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify({ settings: editSettings, voiceSettings: editVoice, woocommerce: editWoo, smtp: editSmtp, voiceRecordingEnabled: editVoiceRecording }),
    });
    if (res.ok) {
      const a = await res.json();
      setAgent(a);
    }
  };

  const handleRenew = async () => {
    if (!confirm("Reset used count to 0? Client can use full limit again.")) return;
    const res = await fetch(`/api/dashboard/agents/${id}/renew`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      const a = await res.json();
      setAgent(a);
    }
  };

  if (!id || loading || !agent) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#0a0a0f] text-white">
        {!id ? "Invalid agent" : loading ? "Loading..." : "Not found"}
      </div>
    );
  }

  const pct = agent.usageLimit > 0 ? Math.min(100, (agent.usedCount / agent.usageLimit) * 100) : 0;

  return (
    <div className="min-h-dvh bg-[#0a0a0f] p-6">
      <div className="mx-auto max-w-4xl">
        <Link href="/dashboard/agents" className="text-yellow-400 hover:underline">
          ← Back to agents
        </Link>
        <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{agent.name || agent.storeName || "Unnamed"}</h1>
            <p className="text-gray-400">{agent.storeName} • {agent.storeUrl || "—"}</p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleRenew}
              className="rounded-lg border border-yellow-500/50 px-4 py-2 text-yellow-400 hover:bg-yellow-500/10"
            >
              Renew Usage
            </button>
            <a
              href={agent.embedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-yellow-500 px-4 py-2 font-semibold text-black hover:bg-yellow-400"
            >
              Open Embed
            </a>
          </div>
        </div>

        <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Usage</h2>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-gray-400">{agent.usedCount} used</span>
                <span className="text-gray-400">{agent.usageLimit} limit</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-black/30">
                <div
                  className={`h-full transition-all ${pct >= 90 ? "bg-red-500" : "bg-yellow-500"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
            <span className={`text-lg font-bold ${pct >= 90 ? "text-red-400" : "text-green-400"}`}>
              {pct.toFixed(0)}%
            </span>
          </div>
        </div>

        <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Voice & Integrations</h2>
          <div className="space-y-6">
            <div>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={editVoiceRecording}
                  onChange={(e) => setEditVoiceRecording(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-300">Enable Voice Conversation Recording</span>
              </label>
              <p className="mt-1 text-xs text-gray-500">When enabled, voice conversations are recorded and saved to Vercel Blob.</p>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-medium text-gray-400">Voice Settings</h3>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs text-gray-500">Speed</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="2"
                    value={editVoice.speed}
                    onChange={(e) => setEditVoice((v) => ({ ...v, speed: Number(e.target.value) || 1 }))}
                    className="w-full rounded border border-white/20 bg-black/30 px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-500">Language</label>
                  <select
                    value={editVoice.primaryLanguage}
                    onChange={(e) => setEditVoice((v) => ({ ...v, primaryLanguage: e.target.value as "ar" | "en" | "auto" }))}
                    className="w-full rounded border border-white/20 bg-black/30 px-3 py-2 text-white"
                  >
                    <option value="auto">Auto</option>
                    <option value="ar">Arabic</option>
                    <option value="en">English</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-500">Tone</label>
                  <select
                    value={editVoice.tone}
                    onChange={(e) => setEditVoice((v) => ({ ...v, tone: e.target.value as VoiceSettings["tone"] }))}
                    className="w-full rounded border border-white/20 bg-black/30 px-3 py-2 text-white"
                  >
                    <option value="neutral">Neutral</option>
                    <option value="friendly">Friendly</option>
                    <option value="professional">Professional</option>
                    <option value="warm">Warm</option>
                  </select>
                </div>
              </div>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-medium text-gray-400">WooCommerce</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  placeholder="Site URL (https://store.com)"
                  value={editWoo.siteUrl}
                  onChange={(e) => setEditWoo((w) => ({ ...w, siteUrl: e.target.value }))}
                  className="rounded border border-white/20 bg-black/30 px-3 py-2 text-white"
                />
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={editWoo.enabled} onChange={(e) => setEditWoo((w) => ({ ...w, enabled: e.target.checked }))} className="rounded" />
                  <span className="text-sm text-gray-400">Enabled</span>
                </label>
                <input
                  placeholder="Consumer Key"
                  value={editWoo.consumerKey}
                  onChange={(e) => setEditWoo((w) => ({ ...w, consumerKey: e.target.value }))}
                  className="rounded border border-white/20 bg-black/30 px-3 py-2 text-white"
                />
                <input
                  placeholder="Consumer Secret"
                  type="password"
                  value={editWoo.consumerSecret}
                  onChange={(e) => setEditWoo((w) => ({ ...w, consumerSecret: e.target.value }))}
                  className="rounded border border-white/20 bg-black/30 px-3 py-2 text-white"
                />
              </div>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-medium text-gray-400">SMTP (Quotation Emails)</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <input placeholder="SMTP Host" value={editSmtp.host} onChange={(e) => setEditSmtp((s) => ({ ...s, host: e.target.value }))} className="rounded border border-white/20 bg-black/30 px-3 py-2 text-white" />
                <input type="number" placeholder="Port" value={editSmtp.port || ""} onChange={(e) => setEditSmtp((s) => ({ ...s, port: Number(e.target.value) || 587 }))} className="rounded border border-white/20 bg-black/30 px-3 py-2 text-white" />
                <input placeholder="User" value={editSmtp.user} onChange={(e) => setEditSmtp((s) => ({ ...s, user: e.target.value }))} className="rounded border border-white/20 bg-black/30 px-3 py-2 text-white" />
                <input type="password" placeholder="Password" value={editSmtp.password} onChange={(e) => setEditSmtp((s) => ({ ...s, password: e.target.value }))} className="rounded border border-white/20 bg-black/30 px-3 py-2 text-white" />
                <input placeholder="From Email" value={editSmtp.fromEmail} onChange={(e) => setEditSmtp((s) => ({ ...s, fromEmail: e.target.value }))} className="rounded border border-white/20 bg-black/30 px-3 py-2 text-white" />
                <input placeholder="From Name" value={editSmtp.fromName} onChange={(e) => setEditSmtp((s) => ({ ...s, fromName: e.target.value }))} className="rounded border border-white/20 bg-black/30 px-3 py-2 text-white" />
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={editSmtp.tls} onChange={(e) => setEditSmtp((s) => ({ ...s, tls: e.target.checked }))} className="rounded" />
                  <span className="text-sm text-gray-400">TLS</span>
                </label>
              </div>
            </div>
          </div>
          <button type="button" onClick={handleSaveSettings} className="mt-4 rounded-lg bg-yellow-500 px-4 py-2 font-semibold text-black hover:bg-yellow-400">Save All</button>
        </div>

        <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Embed URL</h2>
          <code className="block overflow-x-auto rounded bg-black/30 p-3 text-sm text-yellow-300">
            {agent.embedUrl}
          </code>
          <p className="mt-2 text-xs text-gray-500">
            Add this iframe to your store: &lt;iframe src="{agent.embedUrl}" /&gt;
          </p>
        </div>

        <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Conversations</h2>
          {conversations.length === 0 ? (
            <p className="text-gray-500">No conversations yet.</p>
          ) : (
            <div className="max-h-96 space-y-4 overflow-y-auto">
              {conversations.slice(0, 50).map((c) => (
                <div key={c.id} className="rounded-lg border border-white/5 bg-black/20 p-4">
                  <p className="text-xs text-gray-500">{new Date(c.timestamp).toLocaleString()}</p>
                  <p className="mt-2 text-sm text-blue-300">
                    <strong>User:</strong> {c.userMessage}
                  </p>
                  <p className="mt-1 text-sm text-gray-300">
                    <strong>AI:</strong> {c.assistantReply}
                  </p>
                </div>
              ))}
              {conversations.length > 50 && (
                <p className="text-center text-sm text-gray-500">Showing last 50 of {conversations.length}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
