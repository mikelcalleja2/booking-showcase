export function BookingCta({ bookingUrl, price, currency }: { bookingUrl: string; price: number; currency: string }) {
  return (
    <div className="sticky bottom-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:static">
      <p className="text-sm text-slate-500">Price from</p>
      <p className="mb-3 text-2xl font-semibold text-slate-900">
        {price} {currency} <span className="text-sm font-normal text-slate-500">/ night</span>
      </p>
      <a
        href={bookingUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full rounded-lg bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-blue-700"
      >
        Book on Booking.com
      </a>
    </div>
  );
}
