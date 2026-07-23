import { NextRequest, NextResponse } from "next/server";
import { unlink } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db";
import { UPLOAD_DIR } from "@/lib/uploadDir";

type Params = { params: Promise<{ id: string; photoId: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const { photoId } = await params;
  const body = await request.json();
  const data: Record<string, unknown> = {};
  if (typeof body.alt === "string") data.alt = body.alt;
  if (body.sortOrder !== undefined) data.sortOrder = Number(body.sortOrder);

  const photo = await prisma.photo.update({ where: { id: photoId }, data });
  return NextResponse.json(photo);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { photoId } = await params;
  const photo = await prisma.photo.findUnique({ where: { id: photoId } });
  if (photo) {
    const relativePath = photo.url.replace(/^\/media\//, "");
    const filePath = path.join(UPLOAD_DIR, relativePath);
    await unlink(filePath).catch(() => null);
    await prisma.photo.delete({ where: { id: photoId } }).catch(() => null);
  }
  return NextResponse.json({ ok: true });
}
