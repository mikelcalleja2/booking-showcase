import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string; facilityId: string }> };

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { facilityId } = await params;
  await prisma.facility.delete({ where: { id: facilityId } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
