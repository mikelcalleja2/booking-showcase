import Link from "next/link";
import type { Photo, Property } from "@/generated/prisma-client";

export function PropertyCard({ property }: { property: Property & { photos: Photo[] } }) {
  const cover = property.photos[0];

  return (
    <Link
      href={`/properties/${property.slug}`}
      className="group overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:shadow-md"
    >
      <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover.url}
            alt={cover.alt || property.name}
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">No photo</div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-medium text-slate-900">{property.name}</h3>
        <p className="text-sm text-slate-500">{property.city}</p>
        <p className="mt-2 text-sm text-slate-700">
          from <span className="font-semibold">{property.pricePerNight} {property.currency}</span> / night
        </p>
      </div>
    </Link>
  );
}
