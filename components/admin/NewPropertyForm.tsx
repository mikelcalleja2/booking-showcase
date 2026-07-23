"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NewPropertyForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Error creating property");
        return;
      }
      const property = await res.json();
      router.push(`/admin/properties/${property.id}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="new-name">
          New property name
        </label>
        <input
          id="new-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Central London Apartment"
          className="w-72 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={loading || !name.trim()}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {loading ? "Creating…" : "Add property"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
