import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string; reviewId: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const { reviewId } = await params;
  const body = await request.json();

  const data: Record<string, unknown> = {};
  if (typeof body.guestName === "string") data.guestName = body.guestName;
  if (typeof body.text === "string") data.text = body.text;
  if (body.rating !== undefined) data.rating = Number(body.rating);
  if (body.reviewDate) data.reviewDate = new Date(body.reviewDate);
  if (typeof body.sourceLabel === "string") data.sourceLabel = body.sourceLabel;

  const review = await prisma.review.update({ where: { id: reviewId }, data });
  return NextResponse.json(review);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { reviewId } = await params;
  await prisma.review.delete({ where: { id: reviewId } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
