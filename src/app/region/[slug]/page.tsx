import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import HotelCard from "@/components/hotel/HotelCard";
import { getHotelsByRegion, getRegionDirectory, slugify } from "@/lib/data";

export const revalidate = 3600;

export async function generateStaticParams() {
  const regions = await getRegionDirectory();
  return regions.map((r) => ({ slug: slugify(r.region) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const res = await getHotelsByRegion(slug);
  if (!res) return { title: "Region not found" };
  const title = `Marriott elite perks in ${res.label}`;
  const description = `Browse ${res.count} Marriott Bonvoy properties in ${res.label} and see the elite perks guests actually receive at each.`;
  return { title, description, alternates: { canonical: `/region/${slug}` } };
}

export default async function RegionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const res = await getHotelsByRegion(slug);
  if (!res) notFound();

  return (
    <main className="min-h-screen bg-paper text-ink">
      <Header />
      <div className="mx-auto max-w-content px-6 py-12">
        <nav className="text-sm text-ink-soft">
          <Link href="/" className="transition-colors hover:text-ink">Home</Link>
          <span className="px-2">/</span>
          <Link href="/hotels" className="transition-colors hover:text-ink">Hotels</Link>
          <span className="px-2">/</span>
          <span className="text-ink">{res.label}</span>
        </nav>

        <p className="mt-6 text-[13px] font-medium uppercase tracking-eyebrow text-accent">
          Region
        </p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          {res.label}
        </h1>
        <p className="mt-3 text-ink-soft">
          {res.count} propert{res.count === 1 ? "y" : "ies"}
        </p>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {res.hotels.map((h) => (
            <HotelCard key={h.slug} hotel={h} />
          ))}
        </div>

        {res.count > res.hotels.length && (
          <p className="mt-6 text-sm text-ink-soft">
            Showing the {res.hotels.length} most-reported of {res.count}.
          </p>
        )}
      </div>
      <Footer />
    </main>
  );
}
