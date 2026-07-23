import type { Photo } from "@prisma/client";

export function Gallery({ photos, alt }: { photos: Photo[]; alt: string }) {
  if (photos.length === 0) {
    return <div className="aspect-video w-full rounded-xl bg-slate-100" />;
  }

  const [main, ...rest] = photos;

  return (
    <div className="grid grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-xl">
      <div className="col-span-4 row-span-2 aspect-video sm:col-span-2 sm:aspect-auto">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={main.url} alt={main.alt || alt} className="h-full w-full object-cover" />
      </div>
      {rest.slice(0, 4).map((photo) => (
        <div key={photo.id} className="hidden aspect-square sm:block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo.url} alt={photo.alt || alt} className="h-full w-full object-cover" />
        </div>
      ))}
    </div>
  );
}
