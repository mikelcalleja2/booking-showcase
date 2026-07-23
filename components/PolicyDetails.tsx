type Props = {
  checkInTime: string;
  checkOutTime: string;
  cancellationPolicy: string;
  houseRules: string;
};

export function PolicyDetails({ checkInTime, checkOutTime, cancellationPolicy, houseRules }: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-xl border border-slate-200 p-4">
        <h3 className="mb-1 text-sm font-semibold text-slate-900">Check-in / Check-out</h3>
        <p className="text-sm text-slate-600">Check-in: {checkInTime}</p>
        <p className="text-sm text-slate-600">Check-out: {checkOutTime}</p>
      </div>
      <div className="rounded-xl border border-slate-200 p-4">
        <h3 className="mb-1 text-sm font-semibold text-slate-900">Cancellation Policy</h3>
        <p className="whitespace-pre-line text-sm text-slate-600">{cancellationPolicy}</p>
      </div>
      <div className="rounded-xl border border-slate-200 p-4 sm:col-span-2">
        <h3 className="mb-1 text-sm font-semibold text-slate-900">House Rules</h3>
        <p className="whitespace-pre-line text-sm text-slate-600">{houseRules}</p>
      </div>
    </div>
  );
}
