import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { Gallery } from "@/components/Gallery";
import { FacilityList } from "@/components/FacilityList";
import { ReviewList } from "@/components/ReviewList";
import { BookingCta } from "@/components/BookingCta";
import { PolicyDetails } from "@/components/PolicyDetails";

export const dynamic = "force-dynamic";

async function getProperty(slug: string) {
  return prisma.property.findFirst({
    where: { slug, published: true },
    include: {
      photos: { orderBy: { sortOrder: "asc" } },
      facilities: true,
      reviews: { orderBy: { reviewDate: "desc" } },
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const property = await getProperty(slug);
  if (!property) return {};
  return {
    title: property.name,
    description: property.shortDescription || property.description,
  };
}

export default async function PropertyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const property = await getProperty(slug);

  if (!property) notFound();

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-5xl px-6 py-8">
        <a href="/" className="mb-4 inline-block text-sm text-slate-500 hover:underline">
          ← All properties
        </a>

        <h1 className="mb-1 text-2xl font-semibold text-slate-900">{property.name}</h1>
        <p className="mb-6 text-slate-500">
          {property.address ? `${property.address}, ` : ""}
          {property.city}
        </p>

        <div className="mb-8">
          <Gallery photos={property.photos} alt={property.name} />
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            <section>
              <h2 className="mb-2 text-lg font-medium text-slate-900">About this property</h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
                {property.description || property.shortDescription}
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-medium text-slate-900">Amenities</h2>
              <FacilityList facilities={property.facilities} />
            </section>

            <section>
              <h2 className="mb-3 text-lg font-medium text-slate-900">Guest reviews</h2>
              <ReviewList reviews={property.reviews} />
            </section>

            <section>
              <h2 className="mb-3 text-lg font-medium text-slate-900">Policies</h2>
              <PolicyDetails
                checkInTime={property.checkInTime}
                checkOutTime={property.checkOutTime}
                cancellationPolicy={property.cancellationPolicy}
                houseRules={property.houseRules}
              />
            </section>
          </div>

          <div className="lg:col-span-1">
            <BookingCta bookingUrl={property.bookingUrl} price={property.pricePerNight} currency={property.currency} />
          </div>
        </div>
      </main>
    </div>
  );
}
