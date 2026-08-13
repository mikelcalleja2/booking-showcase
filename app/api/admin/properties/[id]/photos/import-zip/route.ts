import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db";
import { UPLOAD_DIR } from "@/lib/uploadDir";
import { readZipEntries } from "@/lib/zip";

type Params = { params: Promise<{ id: string }> };

const MAX_ZIP_SIZE = 200 * 1024 * 1024; // 200MB compressed
const MAX_IMAGE_SIZE = 8 * 1024 * 1024; // 8MB per photo, same cap as single-file upload

const EXTENSION_TO_TYPE: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
};

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const property = await prisma.property.findUnique({ where: { id } });
  if (!property) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing ZIP file" }, { status: 400 });
  }
  if (!file.name.toLowerCase().endsWith(".zip")) {
    return NextResponse.json({ error: "File must be a .zip archive" }, { status: 400 });
  }
  if (file.size > MAX_ZIP_SIZE) {
    return NextResponse.json({ error: "ZIP exceeds 200MB" }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  let entries;
  try {
    entries = readZipEntries(buf);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }

  const imageEntries = entries.filter((e) => {
    const base = e.name.split("/").pop() ?? "";
    if (base.startsWith(".") || base.startsWith("__MACOSX")) return false;
    const ext = base.split(".").pop()?.toLowerCase() ?? "";
    return ext in EXTENSION_TO_TYPE;
  });

  if (imageEntries.length === 0) {
    return NextResponse.json({ error: "No jpg/png/webp/avif images found in the ZIP" }, { status: 400 });
  }

  const uploadDir = path.join(UPLOAD_DIR, property.slug);
  await mkdir(uploadDir, { recursive: true });

  const lastPhoto = await prisma.photo.findFirst({
    where: { propertyId: id },
    orderBy: { sortOrder: "desc" },
  });
  let nextSortOrder = (lastPhoto?.sortOrder ?? -1) + 1;

  let saved = 0;
  const skipped: string[] = [];

  for (const entry of imageEntries) {
    if (entry.data.length > MAX_IMAGE_SIZE) {
      skipped.push(`${entry.name} (too large, over 8MB)`);
      continue;
    }
    const ext = entry.name.split(".").pop()!.toLowerCase();
    const filename = `${randomUUID()}.${ext === "jpeg" ? "jpg" : ext}`;
    await writeFile(path.join(uploadDir, filename), entry.data);
    await prisma.photo.create({
      data: {
        propertyId: id,
        url: `/media/${property.slug}/${filename}`,
        alt: property.name,
        sortOrder: nextSortOrder++,
      },
    });
    saved++;
  }

  return NextResponse.json({ saved, skipped, totalInZip: imageEntries.length });
}
