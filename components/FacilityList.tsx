import type { Facility } from "@/generated/prisma-client";

export function FacilityList({ facilities }: { facilities: Facility[] }) {
  if (facilities.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {facilities.map((facility) => (
        <div key={facility.id} className="flex items-center gap-2 text-sm text-slate-700">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 text-green-600">
            <path
              fillRule="evenodd"
              d="M16.704 5.29a1 1 0 010 1.42l-7.5 7.5a1 1 0 01-1.42 0l-3.5-3.5a1 1 0 111.42-1.42l2.79 2.8 6.79-6.8a1 1 0 011.42 0z"
              clipRule="evenodd"
            />
          </svg>
          {facility.label}
        </div>
      ))}
    </div>
  );
}
