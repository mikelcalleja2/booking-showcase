import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

// "Best effort" retrieval, a single fetch per button press — never runs automatically/repeatedly.
// Booking.com blocks server-to-server requests with an anti-bot challenge (AWS WAF), so the main
// mode is "html" (admin pastes the page source from their own browser). The "url" mode is kept as
// a fast path for pages that don't have this block.

const FETCH_TIMEOUT_MS = 10_000;
const MAX_HTML_LENGTH = 5_000_000; // ~5MB of pasted text, enough for any page

function isAllowedHost(hostname: string) {
  return hostname === "booking.com" || hostname.endsWith(".booking.com");
}

type ImportResult = {
  name?: string;
  description?: string;
  images: string[];
  address?: string;
  ratingValue?: string;
};

function extractFromJsonLd($: cheerio.CheerioAPI): Partial<ImportResult> {
  const result: Partial<ImportResult> = {};

  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).contents().text();
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of items) {
        if (!item || typeof item !== "object") continue;
        if (typeof item.name === "string" && !result.name) result.name = item.name;
        if (typeof item.description === "string" && !result.description) {
          result.description = item.description;
        }
        if (item.address && typeof item.address === "object") {
          const addr = item.address;
          const parts = [addr.streetAddress, addr.addressLocality, addr.addressCountry].filter(Boolean);
          if (parts.length && !result.address) result.address = parts.join(", ");
        }
        if (item.aggregateRating?.ratingValue && !result.ratingValue) {
          result.ratingValue = String(item.aggregateRating.ratingValue);
        }
        if (item.image) {
          const imgs = Array.isArray(item.image) ? item.image : [item.image];
          result.images = [...(result.images ?? []), ...imgs.filter((i: unknown) => typeof i === "string")];
        }
      }
    } catch {
      // Invalid or partial JSON-LD — silently ignored, this is best-effort only
    }
  });

  return result;
}

function extractFromHtml(html: string): ImportResult {
  const $ = cheerio.load(html);

  const ogTitle = $('meta[property="og:title"]').attr("content");
  const ogDescription = $('meta[property="og:description"]').attr("content");
  const ogImages = $('meta[property="og:image"]')
    .map((_, el) => $(el).attr("content"))
    .get()
    .filter((v): v is string => Boolean(v));

  const jsonLd = extractFromJsonLd($);

  return {
    name: jsonLd.name ?? ogTitle,
    description: jsonLd.description ?? ogDescription,
    images: Array.from(new Set([...(jsonLd.images ?? []), ...ogImages])).slice(0, 20),
    address: jsonLd.address,
    ratingValue: jsonLd.ratingValue,
  };
}

function isEmptyResult(result: ImportResult) {
  return !result.name && !result.description && result.images.length === 0;
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));

  // Mode 1: HTML pasted manually by the admin (from their own browser) — no network request made by the server.
  if (typeof body.html === "string" && body.html.trim()) {
    const html = body.html.slice(0, MAX_HTML_LENGTH);
    const result = extractFromHtml(html);
    if (isEmptyResult(result)) {
      return NextResponse.json(
        { error: "No recognizable data found in the pasted code. Fill in manually." },
        { status: 422 },
      );
    }
    return NextResponse.json(result);
  }

  // Mode 2: direct fetch from a URL — best-effort, may fail if the site blocks automated requests
  // (Booking.com does this via an anti-bot challenge; use the HTML mode above in that case).
  const url: string = body.url;
  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "URL or HTML missing" }, { status: 400 });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  if (parsedUrl.protocol !== "https:" || !isAllowedHost(parsedUrl.hostname)) {
    return NextResponse.json(
      { error: "Only https links to booking.com are accepted" },
      { status: 400 },
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let html: string;
  try {
    const res = await fetch(parsedUrl.toString(), {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Booking.com responded with status ${res.status}. Use the pasted-HTML import instead.` },
        { status: 502 },
      );
    }
    html = await res.text();
  } catch {
    return NextResponse.json(
      { error: "Could not fetch the page. Use the pasted-HTML import instead." },
      { status: 502 },
    );
  } finally {
    clearTimeout(timeout);
  }

  const result = extractFromHtml(html);
  if (isEmptyResult(result)) {
    return NextResponse.json(
      {
        error:
          "Could not extract data (Booking.com likely blocked the request). Use the pasted-HTML import instead.",
      },
      { status: 422 },
    );
  }

  return NextResponse.json(result);
}
