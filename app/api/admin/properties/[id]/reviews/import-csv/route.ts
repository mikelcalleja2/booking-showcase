import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseCsvToObjects } from "@/lib/csv";

type Params = { params: Promise<{ id: string }> };

const MAX_SIZE_BYTES = 5 * 1024 * 1024;

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const property = await prisma.property.findUnique({ where: { id } });
  if (!property) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing CSV file" }, { status: 400 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "CSV exceeds 5MB" }, { status: 400 });
  }

  const rows = parseCsvToObjects(await file.text());
  if (rows.length === 0) {
    return NextResponse.json({ error: "No rows found in CSV" }, { status: 400 });
  }

  let imported = 0;
  const skipped: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const guestName = r.guest_name?.trim();
    const text = r.text?.trim();
    const rating = Number(r.rating);
    const rowNum = i + 2;

    if (!guestName || !text || Number.isNaN(rating)) {
      skipped.push(`Row ${rowNum}: missing guest_name/text or invalid rating`);
      continue;
    }
    if (rating < 0 || rating > 10) {
      skipped.push(`Row ${rowNum}: rating must be between 0 and 10`);
      continue;
    }

    const reviewDate = r.review_date?.trim() ? new Date(r.review_date.trim()) : new Date();

    await prisma.review.create({
      data: {
        propertyId: id,
        guestName,
        text,
        rating,
        reviewDate: Number.isNaN(reviewDate.getTime()) ? new Date() : reviewDate,
        sourceLabel: r.source_label?.trim() || "Booking.com",
      },
    });
    imported++;
  }

  return NextResponse.json({ imported, skipped, total: rows.length });
}
