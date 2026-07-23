import { prisma } from "@/lib/db";
import { PropertyCard } from "@/components/PropertyCard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const properties = await prisma.property.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    include: { photos: { orderBy: { sortOrder: "asc" }, take: 1 } },
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-6">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-xl font-semibold text-slate-900">Our Properties</h1>
          <p className="text-sm text-slate-500">Photos, amenities, and real guest reviews.</p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        {properties.length === 0 ? (
          <p className="text-sm text-slate-500">No properties published yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
