import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/slug";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      photos: { orderBy: { sortOrder: "asc" } },
      facilities: true,
      reviews: { orderBy: { reviewDate: "desc" } },
    },
  });
  if (!property) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }
  return NextResponse.json(property);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();

  const existing = await prisma.property.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  const data: Record<string, unknown> = {};
  if (typeof body.name === "string") data.name = body.name;
  if (typeof body.shortDescription === "string") data.shortDescription = body.shortDescription;
  if (typeof body.description === "string") data.description = body.description;
  if (typeof body.address === "string") data.address = body.address;
  if (typeof body.city === "string") data.city = body.city;
  if (body.pricePerNight !== undefined) data.pricePerNight = Number(body.pricePerNight) || 0;
  if (typeof body.currency === "string") data.currency = body.currency;
  if (typeof body.bookingUrl === "string") data.bookingUrl = body.bookingUrl;
  if (typeof body.published === "boolean") data.published = body.published;
  if (typeof body.checkInTime === "string") data.checkInTime = body.checkInTime;
  if (typeof body.checkOutTime === "string") data.checkOutTime = body.checkOutTime;
  if (typeof body.cancellationPolicy === "string") data.cancellationPolicy = body.cancellationPolicy;
  if (typeof body.houseRules === "string") data.houseRules = body.houseRules;

  if (typeof body.slug === "string" && body.slug.trim() && body.slug !== existing.slug) {
    const newSlug = slugify(body.slug);
    const clash = await prisma.property.findUnique({ where: { slug: newSlug } });
    if (clash && clash.id !== id) {
      return NextResponse.json({ error: "This slug is already in use" }, { status: 400 });
    }
    data.slug = newSlug;
  }

  const property = await prisma.property.update({ where: { id }, data });
  return NextResponse.json(property);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  await prisma.property.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
