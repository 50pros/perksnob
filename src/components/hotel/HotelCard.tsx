import Link from "next/link";
import type { DirectoryHotel } from "@/lib/data";

export default function HotelCard({ hotel }: { hotel: DirectoryHotel }) {
  return (
    <Link
      href={`/hotel/${hotel.slug}`}
      className="group flex flex-col justify-between rounded-xl border border-line bg-paper-raised p-5 transition-colors hover:border-ink"
    >
      <div>
        <p className="text-[11px] font-medium uppercase tracking-eyebrow text-accent">
          {hotel.brand}
        </p>
        <h3 className="mt-1.5 font-display text-lg font-semibold leading-snug tracking-tight">
          {hotel.name}
        </h3>
        <p className="mt-1 text-sm text-ink-soft">{hotel.location}</p>
      </div>
      <p className="mt-4 text-xs text-ink-soft">
        {hotel.report_count > 0
          ? `${hotel.report_count} guest report${hotel.report_count === 1 ? "" : "s"}`
          : "No reports yet"}
      </p>
    </Link>
  );
}
