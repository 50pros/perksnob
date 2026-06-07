import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import type { Hotel } from "@/lib/types";
import HotelDetailClient from "./HotelDetailClient";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface HotelPageProps {
  params: Promise<{ slug: string }>;
}

/* ------------------------------------------------------------------ */
/*  generateMetadata                                                  */
/* ------------------------------------------------------------------ */

export async function generateMetadata({
  params,
}: HotelPageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createServerSupabase();

  const { data: hotel } = await supabase
    .from("hotels")
    .select("*")
    .eq("slug", slug)
    .single<Hotel>();

  if (!hotel) {
    return { title: "Hotel Not Found | PerkSnob" };
  }

  // Fetch perk count for description
  const { count: perkCount } = await supabase
    .from("perk_reports")
    .select("*", { count: "exact", head: true })
    .eq("hotel_id", hotel.id);

  const title = `${hotel.name} Elite Perks | PerkSnob`;
  const description = `${perkCount || 0} crowdsourced Marriott Bonvoy elite perk reports at ${hotel.name} (${hotel.brand}) in ${hotel.location}. Real guest data for Titanium, Platinum, and Ambassador Elite benefits.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `/hotel/${hotel.slug}`,
      images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    },
  };
}

/* ------------------------------------------------------------------ */
/*  Server component                                                  */
/* ------------------------------------------------------------------ */

export default async function HotelPage({ params }: HotelPageProps) {
  const { slug } = await params;
  const supabase = await createServerSupabase();

  const { data: hotel } = await supabase
    .from("hotels")
    .select("*")
    .eq("slug", slug)
    .single<Hotel>();

  if (!hotel) {
    notFound();
  }

  // Fetch initial perk count + score for JSON-LD
  const { count: perkCount } = await supabase
    .from("perk_reports")
    .select("*", { count: "exact", head: true })
    .eq("hotel_id", hotel.id);

  const score =
    perkCount && perkCount > 0
      ? Math.min(100, perkCount * 3 + 8)
      : 0;

  /* --- JSON-LD Hotel schema --------------------------------------- */
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Hotel",
    name: hotel.name,
    address: {
      "@type": "PostalAddress",
      streetAddress: hotel.address || undefined,
      addressLocality: hotel.location,
      addressCountry: hotel.country || undefined,
    },
    telephone: hotel.phone || undefined,
    brand: {
      "@type": "Brand",
      name: hotel.brand,
    },
    url: hotel.website || undefined,
  };

  if (hotel.latitude && hotel.longitude) {
    jsonLd.geo = {
      "@type": "GeoCoordinates",
      latitude: hotel.latitude,
      longitude: hotel.longitude,
    };
  }

  if (score > 0) {
    jsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: (score / 20).toFixed(1),
      bestRating: "5",
      ratingCount: perkCount || 0,
    };
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HotelDetailClient hotel={hotel} />
    </>
  );
}
