import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import HotelCard from "@/components/hotel/HotelCard";
import HotelSearch from "@/components/hotel/HotelSearch";
import {
  getTopHotels,
  getBrandDirectory,
  getRegionDirectory,
} from "@/lib/data";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Browse Marriott properties",
  description:
    "Browse 8,982 Marriott Bonvoy properties and see what elite perks each one actually delivers — declared by hotels, confirmed by guests.",
  alternates: { canonical: "/hotels" },
};

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export default async function HotelsPage() {
  const [top, brands, regions] = await Promise.all([
    getTopHotels(24),
    getBrandDirectory(),
    getRegionDirectory(),
  ]);

  return (
    <main className="min-h-screen bg-paper text-ink">
      <Header />
      <div className="mx-auto max-w-content px-6 py-12">
        <p className="text-[13px] font-medium uppercase tracking-eyebrow text-accent">
          The directory
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          Browse every property
        </h1>
        <p className="mt-4 max-w-prose text-lg leading-relaxed text-ink-soft">
          Find any of 8,982 Marriott Bonvoy hotels and see the elite perks guests
          actually receive.
        </p>

        <div className="mt-8 max-w-2xl">
          <HotelSearch />
        </div>

        {/* Most reported */}
        <section className="mt-16">
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            Most reported
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            Properties with the most guest activity right now.
          </p>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {top.map((h) => (
              <HotelCard key={h.slug} hotel={h} />
            ))}
          </div>
        </section>

        {/* Browse by brand */}
        <section className="mt-16">
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            Browse by brand
          </h2>
          <div className="mt-6 flex flex-wrap gap-2.5">
            {brands.map((b) => (
              <Link
                key={b.brand}
                href={`/brand/${slugify(b.brand)}`}
                className="rounded-full border border-line bg-paper-raised px-4 py-2 text-sm transition-colors hover:border-ink"
              >
                {b.brand}
                <span className="ml-2 text-ink-soft">{b.hotel_count}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Browse by region */}
        {regions.length > 0 && (
          <section className="mt-14">
            <h2 className="font-display text-2xl font-semibold tracking-tight">
              Browse by region
            </h2>
            <div className="mt-6 flex flex-wrap gap-2.5">
              {regions.map((r) => (
                <Link
                  key={r.region}
                  href={`/region/${slugify(r.region)}`}
                  className="rounded-full border border-line bg-paper-raised px-4 py-2 text-sm transition-colors hover:border-ink"
                >
                  {r.region}
                  <span className="ml-2 text-ink-soft">{r.hotel_count}</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
      <Footer />
    </main>
  );
}
