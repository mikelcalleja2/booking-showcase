import { prisma } from "@/lib/db";
import { NewPropertyForm } from "@/components/admin/NewPropertyForm";
import { PropertyListRow } from "@/components/admin/PropertyListRow";
import { LogoutButton } from "@/components/admin/LogoutButton";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const properties = await prisma.property.findMany({
    orderBy: { createdAt: "desc" },
    include: { photos: true, reviews: true },
  });

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Properties</h1>
            <p className="text-sm text-slate-500">Manage the showcase pages for your properties.</p>
          </div>
          <LogoutButton />
        </div>

        <div className="mb-8 rounded-xl border border-slate-200 bg-white p-5">
          <NewPropertyForm />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          {properties.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              You don&apos;t have any properties yet. Add your first one above.
            </p>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                  <th className="pb-2 font-medium">Property</th>
                  <th className="pb-2 font-medium">Photos</th>
                  <th className="pb-2 font-medium">Reviews</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium"></th>
                  <th className="pb-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {properties.map((p) => (
                  <PropertyListRow
                    key={p.id}
                    id={p.id}
                    name={p.name}
                    city={p.city}
                    slug={p.slug}
                    published={p.published}
                    photoCount={p.photos.length}
                    reviewCount={p.reviews.length}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
