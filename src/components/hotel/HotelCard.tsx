import Link from "next/link";

function scoreTone(score: number): string {
  if (score >= 70) return "text-delivered";
  if (score >= 40) return "text-partial";
  return "text-disputed";
}

export default function HotelCard({
  hotel,
  score,
}: {
  hotel: {
    slug: string;
    name: string;
    brand: string;
    location: string;
    report_count: number;
  };
  score?: number;
}) {
  return (
    <Link
      href={`/hotel/${hotel.slug}`}
      className="group flex h-full flex-col justify-between rounded-xl border border-line bg-paper-raised p-5 transition-colors hover:border-ink"
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <p className="text-[11px] font-medium uppercase tracking-eyebrow text-accent">
            {hotel.brand}
          </p>
          {typeof score === "number" && score > 0 && (
            <span className={`font-display text-lg font-semibold leading-none ${scoreTone(score)}`}>
              {score}
            </span>
          )}
        </div>
        <h3 className="mt-1.5 font-display text-lg font-semibold leading-snug tracking-tight">
          {hotel.name}
        </h3>
        <p className="mt-1 text-sm text-ink-soft">{hotel.location}</p>
      </div>
      <p className="mt-5 border-t border-line pt-3 text-xs text-ink-soft">
        {hotel.report_count > 0
          ? `${hotel.report_count} guest report${hotel.report_count === 1 ? "" : "s"}`
          : "No reports yet"}
      </p>
    </Link>
  );
}
