import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PropertyEditor } from "@/components/admin/PropertyEditor";

export const dynamic = "force-dynamic";

export default async function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      photos: { orderBy: { sortOrder: "asc" } },
      facilities: true,
      reviews: { orderBy: { reviewDate: "desc" } },
    },
  });

  if (!property) notFound();

  return <PropertyEditor initialProperty={property} />;
}
