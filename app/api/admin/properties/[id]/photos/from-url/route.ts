import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db";
import { UPLOAD_DIR } from "@/lib/uploadDir";

type Params = { params: Promise<{ id: string }> };

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};
const MAX_SIZE_BYTES = 8 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 10_000;

function isAllowedImageHost(hostname: string) {
  return (
    hostname === "booking.com" ||
    hostname.endsWith(".booking.com") ||
    hostname.endsWith(".bstatic.com")
  );
}

// On-demand download of an image suggested by the Booking.com import.
// A single fetch per button press, triggered manually by the admin — never runs automatically.
export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const property = await prisma.property.findUnique({ where: { id } });
  if (!property) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const imageUrl: string = body.url;

  let parsed: URL;
  try {
    parsed = new URL(imageUrl);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }
  if (parsed.protocol !== "https:" || !isAllowedImageHost(parsed.hostname)) {
    return NextResponse.json({ error: "Only images from booking.com/bstatic.com are allowed" }, { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let buffer: Buffer;
  let contentType: string;
  try {
    const res = await fetch(parsed.toString(), { signal: controller.signal });
    if (!res.ok) {
      return NextResponse.json({ error: `Download failed (status ${res.status})` }, { status: 502 });
    }
    contentType = res.headers.get("content-type")?.split(";")[0] ?? "";
    if (!ALLOWED_TYPES.has(contentType)) {
      return NextResponse.json({ error: "Unsupported image type" }, { status: 400 });
    }
    const arrayBuffer = await res.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: "Image exceeds 8MB" }, { status: 400 });
    }
    buffer = Buffer.from(arrayBuffer);
  } catch {
    return NextResponse.json({ error: "Could not download the image" }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }

  const uploadDir = path.join(UPLOAD_DIR, property.slug);
  await mkdir(uploadDir, { recursive: true });
  const filename = `${randomUUID()}.${EXTENSION_BY_TYPE[contentType]}`;
  await writeFile(path.join(uploadDir, filename), buffer);

  const lastPhoto = await prisma.photo.findFirst({ where: { propertyId: id }, orderBy: { sortOrder: "desc" } });
  const photo = await prisma.photo.create({
    data: {
      propertyId: id,
      url: `/media/${property.slug}/${filename}`,
      alt: property.name,
      sortOrder: (lastPhoto?.sortOrder ?? -1) + 1,
    },
  });

  return NextResponse.json(photo, { status: 201 });
}
