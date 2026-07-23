"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  id: string;
  name: string;
  city: string;
  slug: string;
  published: boolean;
  photoCount: number;
  reviewCount: number;
};

export function PropertyListRow({ id, name, city, slug, published, photoCount, reviewCount }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function togglePublished() {
    setBusy(true);
    try {
      await fetch(`/api/admin/properties/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !published }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Permanently delete "${name}"? This action cannot be undone.`)) return;
    setBusy(true);
    try {
      await fetch(`/api/admin/properties/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <tr className="border-b border-slate-100 last:border-0">
      <td className="py-3 pr-4">
        <Link href={`/admin/properties/${id}`} className="font-medium text-slate-900 hover:underline">
          {name}
        </Link>
        <p className="text-xs text-slate-500">{city || "—"}</p>
      </td>
      <td className="py-3 pr-4 text-sm text-slate-500">{photoCount} photos</td>
      <td className="py-3 pr-4 text-sm text-slate-500">{reviewCount} reviews</td>
      <td className="py-3 pr-4">
        <button
          onClick={togglePublished}
          disabled={busy}
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            published ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"
          }`}
        >
          {published ? "Published" : "Draft"}
        </button>
      </td>
      <td className="py-3 pr-4 text-sm">
        {published && (
          <a
            href={`/properties/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-500 hover:underline"
          >
            View page
          </a>
        )}
      </td>
      <td className="py-3 text-right">
        <button onClick={handleDelete} disabled={busy} className="text-sm text-red-600 hover:underline">
          Delete
        </button>
      </td>
    </tr>
  );
}
