import type { Review } from "@prisma/client";

function ratingColor(rating: number) {
  if (rating >= 9) return "bg-green-600";
  if (rating >= 7) return "bg-green-500";
  if (rating >= 5) return "bg-yellow-500";
  return "bg-red-500";
}

export function ReviewList({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) {
    return <p className="text-sm text-slate-400">No reviews yet.</p>;
  }

  const average = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <span className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-semibold text-white ${ratingColor(average)}`}>
          {average.toFixed(1)}
        </span>
        <p className="text-sm text-slate-600">
          {reviews.length} guest {reviews.length === 1 ? "review" : "reviews"}
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {reviews.map((review) => (
          <div key={review.id} className="rounded-xl border border-slate-200 p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-medium text-slate-900">{review.guestName}</p>
              <span className={`rounded px-2 py-0.5 text-xs font-semibold text-white ${ratingColor(review.rating)}`}>
                {review.rating}/10
              </span>
            </div>
            <p className="text-sm text-slate-600">{review.text}</p>
            <p className="mt-2 text-xs text-slate-400">
              {new Date(review.reviewDate).toLocaleDateString("en-GB")} · {review.sourceLabel}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
