import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import DeclaredPerks from "@/components/perk/DeclaredPerks";
import HotelInfoBar from "@/components/hotel/HotelInfoBar";
import AtAGlance from "@/components/hotel/AtAGlance";
import ClaimBanner from "@/components/hotel/ClaimBanner";
import ClaimUnlocks from "@/components/hotel/ClaimUnlocks";
import { BadgeCheck, Sparkles } from "lucide-react";
import { getHotelBySlug, getHotelPageData } from "@/lib/data";
import { CATS } from "@/lib/constants";
import type { EliteTier, PerkCategory } from "@/lib/types";

export const revalidate = 3600; // ISR: pages cache for an hour, regenerate on demand
export const dynamicParams = true;

export async function generateStaticParams() {
  return []; // generate every hotel page on first request, then cache (keeps builds fast)
}

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const catMeta = (k: PerkCategory) =>
  CATS.find((c) => c.key === k) ?? { Icon: Sparkles, label: k };

const tierLabel = (t: EliteTier) => t.charAt(0).toUpperCase() + t.slice(1);

function toneClass(rate: number | null): string {
  if (rate === null) return "text-ink-soft";
  if (rate >= 0.7) return "text-delivered";
  if (rate >= 0.4) return "text-partial";
  return "text-disputed";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const hotel = await getHotelBySlug(slug);
  if (!hotel) return { title: "Hotel not found" };
  const title = `${hotel.name} — elite perks & benefits`;
  const description = `What Marriott Bonvoy elites actually receive at ${hotel.name} (${hotel.brand}) in ${hotel.location} — perks declared by the hotel and confirmed by real guests.`;
  return {
    title,
    description,
    alternates: { canonical: `/hotel/${hotel.slug}` },
    openGraph: { title, description, url: `/hotel/${hotel.slug}` },
  };
}

export default async function HotelPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getHotelPageData(slug);
  if (!data) notFound();

  const { hotel, community, reportCount, isClaimed, declared, deliveryScore } = data;
  const declaredOffered = declared.filter((d) => d.offered);
  const brandSlug = slugify(hotel.brand);
  const countrySuffix =
    hotel.country && !hotel.location.includes(hotel.country) ? ` · ${hotel.country}` : "";

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Hotel",
    name: hotel.name,
    brand: { "@type": "Brand", name: hotel.brand },
    address: {
      "@type": "PostalAddress",
      streetAddress: hotel.address || undefined,
      addressLocality: hotel.location,
      addressCountry: hotel.country || undefined,
    },
    telephone: hotel.phone || undefined,
    url: hotel.website || undefined,
    ...(hotel.latitude && hotel.longitude
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: hotel.latitude,
            longitude: hotel.longitude,
          },
        }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="min-h-screen bg-paper text-ink">
        <Header />
        <div className="mx-auto max-w-content px-6 py-10">
          {/* Breadcrumb */}
          <nav className="text-sm text-ink-soft">
            <Link href="/" className="transition-colors hover:text-ink">Home</Link>
            <span className="px-2">/</span>
            <Link href={`/brand/${brandSlug}`} className="transition-colors hover:text-ink">
              {hotel.brand}
            </Link>
            <span className="px-2">/</span>
            <span className="text-ink">{hotel.name}</span>
          </nav>

          {/* Hero */}
          <div className="mt-6 flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="text-[13px] font-medium uppercase tracking-eyebrow text-accent">
                {hotel.brand}
              </p>
              <h1 className="mt-2 max-w-[20ch] font-display text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl">
                {hotel.name}
              </h1>
              <p className="mt-3 text-ink-soft">
                {hotel.location}
                {countrySuffix}
              </p>
            </div>
            {isClaimed ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-delivered/40 bg-delivered/10 px-3.5 py-1.5 text-sm font-medium text-delivered">
                <BadgeCheck className="h-4 w-4" aria-hidden />
                Verified by the hotel
              </span>
            ) : (
              <Link
                href="/for-hotels"
                className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-accent"
              >
                Are you the hotel? Claim this page
              </Link>
            )}
          </div>

          <HotelInfoBar hotel={hotel} />

          {/* Body: content + sticky sidebar */}
          <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0">
              {!isClaimed && (
                <ClaimBanner hotelName={hotel.name} reportCount={reportCount} />
              )}

              {/* Declared by the hotel (grouped by tier) */}
              {declaredOffered.length > 0 && (
                <DeclaredPerks perks={declaredOffered} slug={hotel.slug} />
              )}

              {/* Community reports */}
              <section
                className={declaredOffered.length > 0 || !isClaimed ? "mt-12" : ""}
              >
                <div className="flex items-baseline justify-between border-b border-line pb-3">
                  <h2 className="font-display text-2xl font-semibold tracking-tight">
                    What guests report
                  </h2>
                  <p className="text-sm text-ink-soft">
                    {reportCount} report{reportCount === 1 ? "" : "s"}
                  </p>
                </div>

                {community.length === 0 ? (
                  <div className="mt-8 rounded-xl border border-dashed border-line p-12 text-center">
                    <p className="font-medium">No guest reports yet.</p>
                    <p className="mt-1 text-sm text-ink-soft">
                      Be the first to share the elite perks you received here — or claim the
                      hotel to declare them officially.
                    </p>
                  </div>
                ) : (
                  <ul>
                    {community.map((c) => {
                      const meta = catMeta(c.category);
                      return (
                        <li
                          key={c.category}
                          className="flex items-start justify-between gap-6 border-b border-line py-5"
                        >
                          <div className="flex items-start gap-3.5">
                            <meta.Icon
                              className="mt-0.5 h-5 w-5 shrink-0 text-ink-soft"
                              aria-hidden
                            />
                            <div>
                              <p className="font-medium">{meta.label}</p>
                              <p className="text-sm text-ink-soft">
                                {c.reports} report{c.reports === 1 ? "" : "s"} ·{" "}
                                {c.tiers.map(tierLabel).join(", ")}
                              </p>
                              {c.sample && (
                                <p className="mt-1.5 max-w-prose text-sm italic text-ink-soft">
                                  &ldquo;{c.sample.slice(0, 140)}
                                  {c.sample.length > 140 ? "…" : ""}&rdquo;
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="shrink-0 text-right">
                            {c.deliveryRate === null ? (
                              <p className="text-sm text-ink-soft">—</p>
                            ) : (
                              <>
                                <p
                                  className={`font-display text-xl font-semibold ${toneClass(c.deliveryRate)}`}
                                >
                                  {Math.round(c.deliveryRate * 100)}%
                                </p>
                                <p className="text-xs text-ink-soft">received</p>
                              </>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              {/* Conversion closer (unclaimed only) */}
              {!isClaimed && <ClaimUnlocks hotelName={hotel.name} />}
            </div>

            {/* Sticky sidebar */}
            <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
              <AtAGlance
                hotel={hotel}
                reportCount={reportCount}
                categoryCount={community.length}
                isClaimed={isClaimed}
                deliveryScore={deliveryScore}
              />
            </aside>
          </div>
        </div>
        <Footer />
      </main>
    </>
  );
}
