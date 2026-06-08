import { MapPin, Phone, BedDouble, ExternalLink } from "lucide-react";
import type { Hotel } from "@/lib/types";

/** Property facts strip under the hotel name: address (→ map), room count,
 *  phone, and a book/website link. Renders only the fields that exist. */
export default function HotelInfoBar({ hotel }: { hotel: Hotel }) {
  const bookUrl =
    hotel.website?.trim() ||
    (hotel.marriott_code ? `https://www.marriott.com/${hotel.marriott_code}` : null);
  const isMarriott = !!bookUrl && bookUrl.includes("marriott.com");

  const mapQuery =
    hotel.latitude != null && hotel.longitude != null
      ? `${hotel.latitude},${hotel.longitude}`
      : hotel.address
        ? `${hotel.name}, ${hotel.address}`
        : null;
  const mapUrl = mapQuery
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`
    : null;

  const items: { icon: typeof MapPin; text: string; href?: string }[] = [];
  if (hotel.address) items.push({ icon: MapPin, text: hotel.address, href: mapUrl ?? undefined });
  if (hotel.room_count && hotel.room_count > 0)
    items.push({ icon: BedDouble, text: `${hotel.room_count.toLocaleString("en-US")} rooms` });
  if (hotel.phone) items.push({ icon: Phone, text: hotel.phone, href: `tel:${hotel.phone}` });

  if (!items.length && !bookUrl) return null;

  return (
    <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2.5 text-sm text-ink-soft">
      {items.map((it, i) => {
        const Icon = it.icon;
        const inner = (
          <>
            <Icon className="h-4 w-4 shrink-0 text-accent" aria-hidden />
            <span>{it.text}</span>
          </>
        );
        return it.href ? (
          <a
            key={i}
            href={it.href}
            target={it.href.startsWith("tel:") ? undefined : "_blank"}
            rel={it.href.startsWith("tel:") ? undefined : "noopener noreferrer"}
            className="inline-flex items-center gap-1.5 transition-colors hover:text-ink"
          >
            {inner}
          </a>
        ) : (
          <span key={i} className="inline-flex items-center gap-1.5">
            {inner}
          </span>
        );
      })}

      {bookUrl && (
        <a
          href={bookUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper-raised px-3.5 py-1.5 font-medium text-ink transition-colors hover:border-accent hover:text-accent"
        >
          {isMarriott ? "Book on Marriott.com" : "Visit website"}
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </a>
      )}
    </div>
  );
}
