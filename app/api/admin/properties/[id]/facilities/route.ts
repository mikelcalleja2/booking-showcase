import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const label: string = body.label?.trim();

  if (!label) {
    return NextResponse.json({ error: "Label is required" }, { status: 400 });
  }

  const facility = await prisma.facility.create({
    data: { propertyId: id, label, icon: body.icon || "check" },
  });
  return NextResponse.json(facility, { status: 201 });
}
