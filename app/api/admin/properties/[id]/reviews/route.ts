import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();

  const guestName: string = body.guestName?.trim();
  const text: string = body.text?.trim();
  const rating = Number(body.rating);

  if (!guestName || !text || Number.isNaN(rating)) {
    return NextResponse.json({ error: "Guest name, text, and rating are required" }, { status: 400 });
  }
  if (rating < 0 || rating > 10) {
    return NextResponse.json({ error: "Rating must be between 0 and 10" }, { status: 400 });
  }

  const review = await prisma.review.create({
    data: {
      propertyId: id,
      guestName,
      text,
      rating,
      reviewDate: body.reviewDate ? new Date(body.reviewDate) : new Date(),
      sourceLabel: body.sourceLabel || "Booking.com",
    },
  });

  return NextResponse.json(review, { status: 201 });
}
