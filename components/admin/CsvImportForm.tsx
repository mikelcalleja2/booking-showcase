"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type ImportResult = {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  results: { row: number; name: string; status: string; reason?: string }[];
};

export function CsvImportForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<ImportResult | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setSummary(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/properties/import-csv", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Import failed");
        return;
      }
      setSummary(data);
      if (fileInputRef.current) fileInputRef.current.value = "";
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="csv-file">
          Import properties from CSV
        </label>
        <input
          id="csv-file"
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          className="block w-72 text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-800"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {loading ? "Importing…" : "Import"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {summary && (
        <div className="w-full text-sm text-slate-600">
          <p>
            {summary.created} created, {summary.updated} updated, {summary.skipped} skipped (of {summary.total} rows).
          </p>
          {summary.skipped > 0 && (
            <ul className="mt-1 list-inside list-disc text-red-600">
              {summary.results
                .filter((r) => r.status === "skipped")
                .map((r) => (
                  <li key={r.row}>
                    Row {r.row} ({r.name}): {r.reason}
                  </li>
                ))}
            </ul>
          )}
        </div>
      )}
    </form>
  );
}
