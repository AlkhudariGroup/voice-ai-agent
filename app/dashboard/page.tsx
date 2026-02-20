"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function DashboardPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("dashboard-auth") === "1") {
      setAuthenticated(true);
    }
  }, []);

  const handleLogin = async () => {
    setError("");
    const res = await fetch("/api/dashboard/agents", {
      headers: password ? { Authorization: `Bearer ${password}` } : {},
    });
    if (res.ok) {
      sessionStorage.setItem("dashboard-auth", "1");
      sessionStorage.setItem("dashboard-secret", password);
      setAuthenticated(true);
    } else {
      setError("Wrong password");
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[#0a0a0f] p-4">
        <div className="w-full max-w-sm rounded-2xl bg-white/5 p-8 backdrop-blur">
          <h1 className="mb-6 text-xl font-bold text-white">Dashboard Login</h1>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            className="mb-4 w-full rounded-lg border border-white/20 bg-black/30 px-4 py-3 text-white placeholder-gray-500"
          />
          {error && <p className="mb-4 text-sm text-red-400">{error}</p>}
          <button
            type="button"
            onClick={handleLogin}
            className="w-full rounded-lg bg-yellow-500 px-4 py-3 font-semibold text-black transition hover:bg-yellow-400"
          >
            Login
          </button>
          <p className="mt-4 text-xs text-gray-500">
            Set DASHBOARD_SECRET in .env.local to enable password protection.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#0a0a0f] p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Voice AI Dashboard</h1>
          <Link
            href="/dashboard/agents/new"
            className="rounded-lg bg-yellow-500 px-4 py-2 font-semibold text-black hover:bg-yellow-400"
          >
            + New Agent
          </Link>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <p className="text-gray-400">
            <Link href="/dashboard/agents" className="text-yellow-400 hover:underline">
              View all agents
            </Link>{" "}
            to manage stores, view conversations, and renew usage.
            {" "}
            <Link href="/dashboard/voice" className="text-yellow-400 hover:underline">
              Voice Conversations
            </Link>{" "}
            to listen to recordings (when enabled per agent).
          </p>
        </div>
      </div>
    </div>
  );
}
