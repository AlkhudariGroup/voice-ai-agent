"use client";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center p-6 text-white">
      <div className="text-6xl mb-4">📡</div>
      <h1 className="text-2xl font-semibold mb-2">You&apos;re offline</h1>
      <p className="text-gray-400 text-center mb-6">
        Check your connection and try again.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-6 py-3 bg-indigo-600 rounded-lg hover:bg-indigo-500 transition"
      >
        Retry
      </button>
    </div>
  );
}
