import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import { getBrandDirectory, slugify } from "@/lib/data";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Browse Marriott brands",
  description:
    "Every Marriott Bonvoy brand — Ritz-Carlton, St. Regis, W, JW Marriott, Westin, Sheraton and more. See the elite perks each brand's properties actually deliver.",
  alternates: { canonical: "/brands" },
};

export default async function BrandsPage() {
  const brands = await getBrandDirectory();

  return (
    <main className="min-h-screen bg-paper text-ink">
      <Header />
      <div className="mx-auto max-w-content px-6 py-12">
        <p className="text-[13px] font-medium uppercase tracking-eyebrow text-accent">
          Brands
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          Browse by brand
        </h1>
        <p className="mt-4 max-w-prose text-lg leading-relaxed text-ink-soft">
          Every Marriott Bonvoy brand we track, with the elite perks guests actually
          receive at each property.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {brands.map((b) => (
            <Link
              key={b.brand}
              href={`/brand/${slugify(b.brand)}`}
              className="flex items-center justify-between rounded-xl border border-line bg-paper-raised px-5 py-4 transition-colors hover:border-ink"
            >
              <span className="font-display text-lg font-semibold tracking-tight">
                {b.brand}
              </span>
              <span className="text-sm text-ink-soft">
                {b.hotel_count} propert{b.hotel_count === 1 ? "y" : "ies"}
              </span>
            </Link>
          ))}
        </div>
      </div>
      <Footer />
    </main>
  );
}
