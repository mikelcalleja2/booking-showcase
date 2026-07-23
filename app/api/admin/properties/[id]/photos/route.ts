import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db";
import { UPLOAD_DIR } from "@/lib/uploadDir";

type Params = { params: Promise<{ id: string }> };

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const MAX_SIZE_BYTES = 8 * 1024 * 1024; // 8MB

const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
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
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Unsupported file type (jpg, png, webp, avif only)" }, { status: 400 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "File exceeds 8MB" }, { status: 400 });
  }

  const uploadDir = path.join(UPLOAD_DIR, property.slug);
  await mkdir(uploadDir, { recursive: true });

  const extension = EXTENSION_BY_TYPE[file.type];
  const filename = `${randomUUID()}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, filename), buffer);

  const lastPhoto = await prisma.photo.findFirst({
    where: { propertyId: id },
    orderBy: { sortOrder: "desc" },
  });

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
