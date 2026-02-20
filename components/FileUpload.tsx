"use client";

import { useRef, useState } from "react";

interface FileUploadProps {
  onUpload: (url: string, file: File) => void;
}

export function FileUpload({ onUpload }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      onUpload(data.url, file);
    } catch {
      // upload failed
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
        disabled={uploading}
        className="rounded-xl border-2 border-yellow-500 bg-yellow-500/20 px-5 py-3 text-sm font-semibold text-yellow-400 shadow-lg transition hover:bg-yellow-500/30 disabled:opacity-50"
      >
        {uploading ? "⏳ Uploading..." : "📷 Upload photo"}
      </button>
    </div>
  );
}
