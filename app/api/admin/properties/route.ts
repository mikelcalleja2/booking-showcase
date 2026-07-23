import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/slug";

export async function GET() {
  const properties = await prisma.property.findMany({
    orderBy: { createdAt: "desc" },
    include: { photos: { orderBy: { sortOrder: "asc" } }, facilities: true, reviews: true },
  });
  return NextResponse.json(properties);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const name: string = body.name?.trim();

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const baseSlug = slugify(name) || "property";
  let slug = baseSlug;
  let suffix = 1;
  while (await prisma.property.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  const property = await prisma.property.create({
    data: {
      name,
      slug,
      shortDescription: body.shortDescription ?? "",
      description: body.description ?? "",
      address: body.address ?? "",
      city: body.city ?? "",
      pricePerNight: Number(body.pricePerNight) || 0,
      currency: body.currency || "EUR",
      bookingUrl: body.bookingUrl ?? "",
      published: false,
    },
  });

  return NextResponse.json(property, { status: 201 });
}
