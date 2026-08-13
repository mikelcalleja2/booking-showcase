import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseCsvToObjects } from "@/lib/csv";
import { slugify, slugFromBookingUrl } from "@/lib/slug";

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB of CSV text is enormous already

type RowResult = { row: number; name: string; status: "created" | "updated" | "skipped"; reason?: string };

function truthy(v: string | undefined) {
  return v === "1" || v?.toLowerCase() === "true" || v?.toLowerCase() === "yes";
}

export async function POST(request: NextRequest) {
  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing CSV file" }, { status: 400 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "CSV exceeds 5MB" }, { status: 400 });
  }

  const text = await file.text();
  const rows = parseCsvToObjects(text);
  if (rows.length === 0) {
    return NextResponse.json({ error: "No rows found in CSV" }, { status: 400 });
  }

  const results: RowResult[] = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const rowNum = i + 2; // +1 for header, +1 for 1-indexing
    const name = r.name?.trim();
    if (!name) {
      results.push({ row: rowNum, name: "(no name)", status: "skipped", reason: "Missing name" });
      continue;
    }

    const bookingUrl = r.booking_url?.trim() ?? "";
    let slug = bookingUrl ? slugFromBookingUrl(bookingUrl) : "";
    if (!slug) slug = slugify(name) || "property";

    const facilities = (r.facilities ?? "")
      .split("|")
      .map((f) => f.trim())
      .filter(Boolean);

    const data = {
      name,
      shortDescription: r.short_description ?? "",
      description: r.description ?? "",
      address: r.address ?? "",
      city: r.city ?? "",
      pricePerNight: Number(r.price_per_night) || 0,
      currency: r.currency || "EUR",
      bookingUrl,
      checkInTime: r.check_in_time || undefined,
      checkOutTime: r.check_out_time || undefined,
      cancellationPolicy: r.cancellation_policy || undefined,
      houseRules: r.house_rules || undefined,
      published: truthy(r.published),
    };

    const existing = await prisma.property.findUnique({ where: { slug } });

    if (existing) {
      await prisma.property.update({ where: { slug }, data });
      await prisma.facility.deleteMany({ where: { propertyId: existing.id } });
      if (facilities.length) {
        await prisma.facility.createMany({
          data: facilities.map((label) => ({ propertyId: existing.id, label })),
        });
      }
      results.push({ row: rowNum, name, status: "updated" });
    } else {
      const created = await prisma.property.create({ data: { ...data, slug } });
      if (facilities.length) {
        await prisma.facility.createMany({
          data: facilities.map((label) => ({ propertyId: created.id, label })),
        });
      }
      results.push({ row: rowNum, name, status: "created" });
    }
  }

  const created = results.filter((r) => r.status === "created").length;
  const updated = results.filter((r) => r.status === "updated").length;
  const skipped = results.filter((r) => r.status === "skipped").length;

  return NextResponse.json({ total: rows.length, created, updated, skipped, results });
}
