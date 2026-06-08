import Link from "next/link";
import type { Hotel } from "@/lib/types";
import type { DeliveryScore } from "@/lib/data";

/** Sticky sidebar summary card — the quick-scan facts + claim status. */
export default function AtAGlance({
  hotel,
  reportCount,
  categoryCount,
  isClaimed,
  deliveryScore,
}: {
  hotel: Hotel;
  reportCount: number;
  categoryCount: number;
  isClaimed: boolean;
  deliveryScore: DeliveryScore | null;
}) {
  const location =
    hotel.country && !hotel.location.includes(hotel.country)
      ? `${hotel.location}, ${hotel.country}`
      : hotel.location;

  const rows: [string, string][] = [
    ["Brand", hotel.brand],
    ["Location", location],
  ];
  if (hotel.room_count && hotel.room_count > 0)
    rows.push(["Rooms", hotel.room_count.toLocaleString("en-US")]);
  rows.push(["Guest reports", reportCount.toLocaleString("en-US")]);
  if (categoryCount > 0) rows.push(["Perks tracked", String(categoryCount)]);

  return (
    <div className="rounded-xl border border-line bg-paper-raised p-6">
      <p className="font-display text-lg font-semibold">At a glance</p>

      <div className="mt-4">
        {isClaimed ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-delivered/40 bg-delivered/10 px-3 py-1 text-xs font-medium text-delivered">
            ✓ Verified by the hotel
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-3 py-1 text-xs font-medium text-ink-soft">
            Unclaimed listing
          </span>
        )}
      </div>

      {deliveryScore && (
        <div className="mt-4 flex items-center gap-3 rounded-lg bg-accent-soft p-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-paper font-display text-2xl font-semibold text-accent">
            {deliveryScore.grade}
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium text-accent">Delivery score</p>
            <p className="text-xs text-ink-soft">
              {Math.round(deliveryScore.avgDelivery * 100)}% avg delivery ·{" "}
              {deliveryScore.confirmations} confirmed
            </p>
          </div>
        </div>
      )}

      <dl className="mt-5">
        {rows.map(([k, v]) => (
          <div
            key={k}
            className="flex items-start justify-between gap-4 border-t border-line py-2.5 text-sm"
          >
            <dt className="shrink-0 text-ink-soft">{k}</dt>
            <dd className="text-right font-medium">{v}</dd>
          </div>
        ))}
      </dl>

      {!isClaimed && (
        <Link
          href="/for-hotels"
          className="mt-4 block border-t border-line pt-4 text-sm font-medium text-accent underline-offset-2 hover:underline"
        >
          Is this your hotel? Claim it free →
        </Link>
      )}
    </div>
  );
}
