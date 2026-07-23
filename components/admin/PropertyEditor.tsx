"use client";

import { useRef, useState } from "react";
import type { Facility, Photo, Property, Review } from "@/generated/prisma-client";

type FullProperty = Property & { facilities: Facility[]; photos: Photo[]; reviews: Review[] };

type ImportSuggestion = {
  name?: string;
  description?: string;
  images: string[];
  address?: string;
  ratingValue?: string;
};

function formatDateInput(date: Date | string) {
  return new Date(date).toISOString().slice(0, 10);
}

export function PropertyEditor({ initialProperty }: { initialProperty: FullProperty }) {
  const [property, setProperty] = useState(initialProperty);
  const [savingGeneral, setSavingGeneral] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const [importUrl, setImportUrl] = useState(initialProperty.bookingUrl);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<ImportSuggestion | null>(null);
  const [importMode, setImportMode] = useState<"url" | "html">("url");
  const [pastedHtml, setPastedHtml] = useState("");

  const [newFacility, setNewFacility] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newReview, setNewReview] = useState({ guestName: "", rating: "9", text: "", reviewDate: formatDateInput(new Date()) });

  async function refetch() {
    const res = await fetch(`/api/admin/properties/${property.id}`);
    if (res.ok) setProperty(await res.json());
  }

  async function handleImport() {
    const payload =
      importMode === "html" ? { html: pastedHtml } : { url: importUrl.trim() };
    if (importMode === "html" ? !pastedHtml.trim() : !importUrl.trim()) return;

    setImporting(true);
    setImportError(null);
    setSuggestion(null);
    try {
      const res = await fetch("/api/admin/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setImportError(data.error ?? "Import failed");
        return;
      }
      setSuggestion(data);
    } finally {
      setImporting(false);
    }
  }

  function applySuggestionText() {
    if (!suggestion) return;
    setProperty((p) => ({
      ...p,
      name: suggestion.name || p.name,
      description: suggestion.description || p.description,
      shortDescription: p.shortDescription || (suggestion.description ?? "").slice(0, 200),
      address: suggestion.address || p.address,
      bookingUrl: importUrl.trim() || p.bookingUrl,
    }));
    setSaveMessage("Fields pre-filled — review and click “Save”.");
  }

  async function addSuggestedImage(url: string) {
    setUploading(true);
    try {
      const res = await fetch(`/api/admin/properties/${property.id}/photos/from-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (res.ok) await refetch();
    } finally {
      setUploading(false);
    }
  }

  async function saveGeneral(e: React.FormEvent) {
    e.preventDefault();
    setSavingGeneral(true);
    setSaveMessage(null);
    try {
      const res = await fetch(`/api/admin/properties/${property.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: property.name,
          slug: property.slug,
          shortDescription: property.shortDescription,
          description: property.description,
          address: property.address,
          city: property.city,
          pricePerNight: property.pricePerNight,
          currency: property.currency,
          bookingUrl: property.bookingUrl,
          checkInTime: property.checkInTime,
          checkOutTime: property.checkOutTime,
          cancellationPolicy: property.cancellationPolicy,
          houseRules: property.houseRules,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveMessage(data.error ?? "Error saving");
        return;
      }
      setProperty((p) => ({ ...p, ...data }));
      setSaveMessage("Saved.");
    } finally {
      setSavingGeneral(false);
    }
  }

  async function togglePublished() {
    const res = await fetch(`/api/admin/properties/${property.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !property.published }),
    });
    if (res.ok) setProperty((p) => ({ ...p, published: !p.published }));
  }

  async function addFacility(e: React.FormEvent) {
    e.preventDefault();
    if (!newFacility.trim()) return;
    const res = await fetch(`/api/admin/properties/${property.id}/facilities`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: newFacility.trim() }),
    });
    if (res.ok) {
      setNewFacility("");
      await refetch();
    }
  }

  async function removeFacility(facilityId: string) {
    await fetch(`/api/admin/properties/${property.id}/facilities/${facilityId}`, { method: "DELETE" });
    await refetch();
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/admin/properties/${property.id}/photos`, { method: "POST", body: formData });
      if (res.ok) await refetch();
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      setUploading(false);
    }
  }

  async function removePhoto(photoId: string) {
    await fetch(`/api/admin/properties/${property.id}/photos/${photoId}`, { method: "DELETE" });
    await refetch();
  }

  async function addReview(e: React.FormEvent) {
    e.preventDefault();
    if (!newReview.guestName.trim() || !newReview.text.trim()) return;
    const res = await fetch(`/api/admin/properties/${property.id}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newReview),
    });
    if (res.ok) {
      setNewReview({ guestName: "", rating: "9", text: "", reviewDate: formatDateInput(new Date()) });
      await refetch();
    }
  }

  async function removeReview(reviewId: string) {
    await fetch(`/api/admin/properties/${property.id}/reviews/${reviewId}`, { method: "DELETE" });
    await refetch();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <a href="/admin" className="text-sm text-slate-500 hover:underline">
            ← All properties
          </a>
          <h1 className="text-2xl font-semibold text-slate-900">{property.name}</h1>
        </div>
        <button
          onClick={togglePublished}
          className={`rounded-full px-4 py-1.5 text-sm font-medium ${
            property.published ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"
          }`}
        >
          {property.published ? "Published — click to unpublish" : "Draft — click to publish"}
        </button>
      </div>

      {/* Import from Booking.com */}
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-1 font-medium text-slate-900">Import from Booking.com</h2>
        <p className="mb-3 text-sm text-slate-500">
          A single fetch, on demand. The result is best-effort — review before saving.
        </p>

        <div className="mb-3 flex gap-1 rounded-lg bg-slate-100 p-1 text-sm">
          <button
            onClick={() => setImportMode("url")}
            className={`flex-1 rounded-md px-3 py-1.5 ${importMode === "url" ? "bg-white shadow-sm" : "text-slate-500"}`}
          >
            From link
          </button>
          <button
            onClick={() => setImportMode("html")}
            className={`flex-1 rounded-md px-3 py-1.5 ${importMode === "html" ? "bg-white shadow-sm" : "text-slate-500"}`}
          >
            From pasted HTML (recommended)
          </button>
        </div>

        {importMode === "url" ? (
          <>
            <p className="mb-2 text-xs text-slate-400">
              Booking.com usually blocks automated requests — if you get an error, use the “From
              pasted HTML” tab.
            </p>
            <div className="flex gap-2">
              <input
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
                placeholder="https://www.booking.com/hotel/..."
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              />
              <button
                onClick={handleImport}
                disabled={importing || !importUrl.trim()}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {importing ? "Importing…" : "Import from URL"}
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="mb-2 text-xs text-slate-500">
              Open your property&apos;s page on booking.com in your browser → right-click → “View
              page source” (or <kbd>Ctrl+U</kbd>) → <kbd>Ctrl+A</kbd>, <kbd>Ctrl+C</kbd> → paste below.
            </p>
            <textarea
              value={pastedHtml}
              onChange={(e) => setPastedHtml(e.target.value)}
              placeholder="Paste the page's HTML source here…"
              rows={4}
              className="mb-2 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs focus:border-slate-500 focus:outline-none"
            />
            <button
              onClick={handleImport}
              disabled={importing || !pastedHtml.trim()}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {importing ? "Extracting…" : "Extract from pasted HTML"}
            </button>
          </>
        )}
        {importError && <p className="mt-2 text-sm text-red-600">{importError}</p>}
        {suggestion && (
          <div className="mt-4 rounded-lg bg-slate-50 p-4">
            <p className="mb-2 text-sm font-medium text-slate-700">Extracted result:</p>
            {suggestion.name && <p className="text-sm text-slate-600">Name: {suggestion.name}</p>}
            {suggestion.address && <p className="text-sm text-slate-600">Address: {suggestion.address}</p>}
            {suggestion.description && (
              <p className="mt-1 line-clamp-3 text-sm text-slate-600">{suggestion.description}</p>
            )}
            <button
              onClick={applySuggestionText}
              className="mt-3 rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-white"
            >
              Pre-fill the form below
            </button>
            {suggestion.images.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-sm font-medium text-slate-700">Suggested photos:</p>
                <div className="grid grid-cols-4 gap-2">
                  {suggestion.images.map((img) => (
                    <div key={img} className="group relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img} alt="" className="h-20 w-full rounded-lg object-cover" />
                      <button
                        onClick={() => addSuggestedImage(img)}
                        disabled={uploading}
                        className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50 text-xs text-white opacity-0 group-hover:opacity-100"
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* General info */}
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 font-medium text-slate-900">General info</h2>
        <form onSubmit={saveGeneral} className="space-y-3">
          <Field label="Name">
            <input
              value={property.name}
              onChange={(e) => setProperty((p) => ({ ...p, name: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Slug (URL)">
            <div className="flex items-center gap-1 text-sm text-slate-500">
              <span>/properties/</span>
              <input
                value={property.slug}
                onChange={(e) => setProperty((p) => ({ ...p, slug: e.target.value }))}
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
              />
            </div>
          </Field>
          <Field label="Short description (for cards)">
            <input
              value={property.shortDescription}
              onChange={(e) => setProperty((p) => ({ ...p, shortDescription: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Full description">
            <textarea
              value={property.description}
              onChange={(e) => setProperty((p) => ({ ...p, description: e.target.value }))}
              rows={5}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="City">
              <input
                value={property.city}
                onChange={(e) => setProperty((p) => ({ ...p, city: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </Field>
            <Field label="Address">
              <input
                value={property.address}
                onChange={(e) => setProperty((p) => ({ ...p, address: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Price / night">
              <input
                type="number"
                step="0.01"
                value={property.pricePerNight}
                onChange={(e) => setProperty((p) => ({ ...p, pricePerNight: Number(e.target.value) }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </Field>
            <Field label="Currency">
              <input
                value={property.currency}
                onChange={(e) => setProperty((p) => ({ ...p, currency: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </Field>
          </div>
          <Field label="Booking.com link (for the booking button)">
            <input
              value={property.bookingUrl}
              onChange={(e) => setProperty((p) => ({ ...p, bookingUrl: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </Field>

          <div className="border-t border-slate-100 pt-3">
            <p className="mb-3 text-sm font-medium text-slate-700">
              Policies shown on the public page
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Check-in">
                <input
                  value={property.checkInTime}
                  onChange={(e) => setProperty((p) => ({ ...p, checkInTime: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </Field>
              <Field label="Check-out">
                <input
                  value={property.checkOutTime}
                  onChange={(e) => setProperty((p) => ({ ...p, checkOutTime: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </Field>
            </div>
            <div className="mt-3">
              <Field label="Cancellation policy">
                <textarea
                  value={property.cancellationPolicy}
                  onChange={(e) => setProperty((p) => ({ ...p, cancellationPolicy: e.target.value }))}
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </Field>
            </div>
            <div className="mt-3">
              <Field label="House rules">
                <textarea
                  value={property.houseRules}
                  onChange={(e) => setProperty((p) => ({ ...p, houseRules: e.target.value }))}
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </Field>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={savingGeneral}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {savingGeneral ? "Saving…" : "Save"}
            </button>
            {saveMessage && <span className="text-sm text-slate-500">{saveMessage}</span>}
          </div>
        </form>
      </section>

      {/* Amenities */}
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 font-medium text-slate-900">Amenities</h2>
        <div className="mb-3 flex flex-wrap gap-2">
          {property.facilities.map((f) => (
            <span key={f.id} className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
              {f.label}
              <button onClick={() => removeFacility(f.id)} className="text-slate-400 hover:text-red-600">
                ×
              </button>
            </span>
          ))}
          {property.facilities.length === 0 && <p className="text-sm text-slate-400">No amenities added yet.</p>}
        </div>
        <form onSubmit={addFacility} className="flex gap-2">
          <input
            value={newFacility}
            onChange={(e) => setNewFacility(e.target.value)}
            placeholder="e.g. Free Wi-Fi"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <button type="submit" className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50">
            Add
          </button>
        </form>
      </section>

      {/* Photos */}
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 font-medium text-slate-900">Photos</h2>
        <div className="mb-3 grid grid-cols-4 gap-2">
          {property.photos.map((photo) => (
            <div key={photo.id} className="group relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.url} alt={photo.alt} className="h-24 w-full rounded-lg object-cover" />
              <button
                onClick={() => removePhoto(photo.id)}
                className="absolute right-1 top-1 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white opacity-0 group-hover:opacity-100"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          onChange={handleFileUpload}
          disabled={uploading}
          className="text-sm"
        />
      </section>

      {/* Reviews */}
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 font-medium text-slate-900">Reviews</h2>
        <div className="mb-4 space-y-3">
          {property.reviews.map((review) => (
            <div key={review.id} className="rounded-lg border border-slate-100 p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-900">
                  {review.guestName} · {review.rating}/10
                </p>
                <button onClick={() => removeReview(review.id)} className="text-xs text-red-600 hover:underline">
                  Delete
                </button>
              </div>
              <p className="mt-1 text-sm text-slate-600">{review.text}</p>
              <p className="mt-1 text-xs text-slate-400">
                {formatDateInput(review.reviewDate)} · {review.sourceLabel}
              </p>
            </div>
          ))}
          {property.reviews.length === 0 && <p className="text-sm text-slate-400">No reviews added yet.</p>}
        </div>
        <form onSubmit={addReview} className="space-y-2 rounded-lg bg-slate-50 p-3">
          <div className="grid grid-cols-2 gap-2">
            <input
              value={newReview.guestName}
              onChange={(e) => setNewReview((r) => ({ ...r, guestName: e.target.value }))}
              placeholder="Guest name"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              type="number"
              min="0"
              max="10"
              step="0.1"
              value={newReview.rating}
              onChange={(e) => setNewReview((r) => ({ ...r, rating: e.target.value }))}
              placeholder="Rating (0-10)"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <textarea
            value={newReview.text}
            onChange={(e) => setNewReview((r) => ({ ...r, text: e.target.value }))}
            placeholder="Review text"
            rows={2}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={newReview.reviewDate}
              onChange={(e) => setNewReview((r) => ({ ...r, reviewDate: e.target.value }))}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
              Add review
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
  );
}
