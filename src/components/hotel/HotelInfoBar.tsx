import { MapPin, Phone, Globe, ExternalLink } from "lucide-react";
import type { Hotel } from "@/lib/types";

interface HotelInfoBarProps {
  hotel: Hotel;
}

export default function HotelInfoBar({ hotel }: HotelInfoBarProps) {
  const items: { icon: React.ReactNode; text: string; href?: string }[] = [];

  if (hotel.address) {
    items.push({
      icon: <MapPin className="h-3.5 w-3.5 shrink-0" />,
      text: hotel.address,
    });
  }
  if (hotel.phone) {
    items.push({
      icon: <Phone className="h-3.5 w-3.5 shrink-0" />,
      text: hotel.phone,
      href: `tel:${hotel.phone}`,
    });
  }
  if (hotel.website) {
    items.push({
      icon: <Globe className="h-3.5 w-3.5 shrink-0" />,
      text: "Hotel website",
      href: hotel.website,
    });
  }

  const hasMarriottLink = !!hotel.marriott_code;
  if (!items.length && !hasMarriottLink) return null;

  return (
    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-1.5">
          {item.icon}
          {item.href ? (
            <a
              href={item.href}
              target={item.href.startsWith("tel:") ? undefined : "_blank"}
              rel={
                item.href.startsWith("tel:") ? undefined : "noopener noreferrer"
              }
              className="text-sm text-slate-500 no-underline transition-colors hover:text-slate-900"
            >
              {item.text}
            </a>
          ) : (
            <span>{item.text}</span>
          )}
        </div>
      ))}

      {hasMarriottLink && (
        <a
          href={`https://www.marriott.com/hotels/travel/${hotel.marriott_code}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-md bg-white px-4 py-2 text-xs font-bold text-slate-900 no-underline transition-colors hover:bg-slate-100"
        >
          Book on Marriott.com
          <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </div>
  );
}
