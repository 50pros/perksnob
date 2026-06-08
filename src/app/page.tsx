import Link from "next/link";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import HotelSearch from "@/components/hotel/HotelSearch";
import HotelScrollRow from "@/components/hotel/HotelScrollRow";
import { getHomeRows, getHomeStats } from "@/lib/data";
import { CATS } from "@/lib/constants";

export const revalidate = 3600;

const fmt = (n: number) => n.toLocaleString("en-US");

const toneClass: Record<string, string> = {
  delivered: "text-delivered",
  partial: "text-partial",
  disputed: "text-disputed",
};

const SPECIMEN: Array<[string, string, number, keyof typeof toneClass]> = [
  ["Suite upgrade", "Proactive at check-in", 68, "delivered"],
  ["Complimentary breakfast", "Full breakfast, main restaurant", 91, "delivered"],
  ["Lounge access", "Open · evening apps", 42, "partial"],
  ["4 PM late checkout", "On request", 23, "disputed"],
];

export default async function HomePage() {
  const [rows, stats] = await Promise.all([getHomeRows(), getHomeStats()]);

  return (
    <main className="min-h-screen bg-paper text-ink">
      <Header />

      {/* Hero --------------------------------------------------------------- */}
      <section className="mx-auto max-w-content px-6 pb-10 pt-20">
        <p className="text-[13px] font-medium uppercase tracking-eyebrow text-accent">
          Marriott Bonvoy elite benefits directory
        </p>
        <h1 className="mt-5 max-w-[20ch] font-display text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
          Discover hotels, for the <span className="italic">elite perks</span>
        </h1>
        <p className="mt-6 max-w-prose text-lg leading-relaxed text-ink-soft">
          A platform for Titanium, Platinum, and Ambassador Elite members to discover,
          browse, search, and find what perks &amp; benefits hotel properties provide.
        </p>

        <div className="mt-8 max-w-2xl">
          <HotelSearch />
        </div>
        <div className="mt-4">
          <Link
            href="/hotels"
            className="text-sm font-medium text-accent underline-offset-4 hover:underline"
          >
            Browse all {fmt(stats.hotels)} properties →
          </Link>
        </div>

        <dl className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-4">
          {[
            [fmt(stats.hotels), "Properties"],
            [fmt(stats.reports), "Guest reports"],
            [String(CATS.length), "Perk categories"],
            ["Free", "Community-led"],
          ].map(([n, l]) => (
            <div key={l} className="bg-paper px-5 py-6">
              <dt className="font-display text-3xl font-semibold">{n}</dt>
              <dd className="mt-1 text-sm text-ink-soft">{l}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Curated property rows ---------------------------------------------- */}
      <section className="mx-auto max-w-content px-6 pb-10">
        {rows.map((r) => (
          <HotelScrollRow
            key={r.key}
            title={r.title}
            subtitle={r.subtitle}
            hotels={r.hotels}
          />
        ))}
      </section>

      {/* How to read a hotel: the honesty gap ------------------------------- */}
      <section className="border-t border-line bg-paper-raised">
        <div className="mx-auto max-w-content px-6 py-16">
          <p className="text-[13px] font-medium uppercase tracking-eyebrow text-ink-soft">
            How to read a property
          </p>
          <div className="mt-6 grid gap-10 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <h2 className="font-display text-3xl font-semibold tracking-tight">
                The Ritz-Carlton, Naples
              </h2>
              <p className="mt-1 text-ink-soft">Naples, Florida — viewing Titanium Elite</p>
              <div className="mt-7 border-y border-line">
                {SPECIMEN.map(([perk, claim, rate, tone]) => (
                  <div
                    key={perk}
                    className="flex items-center justify-between border-b border-line py-4 last:border-b-0"
                  >
                    <div>
                      <p className="font-medium">{perk}</p>
                      <p className="text-sm text-ink-soft">Hotel declares: {claim}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-display text-xl font-semibold ${toneClass[tone]}`}>
                        {rate}%
                      </p>
                      <p className="text-xs text-ink-soft">guests confirm</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <aside className="self-start rounded-xl border border-line bg-paper p-7">
              <p className="font-display text-lg font-semibold">The honesty gap</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                Hotels declare the perks they offer each tier. Guests confirm what they
                actually received. When a hotel claims a perk guests routinely don&rsquo;t
                get, the gap shows — the signal Marriott&rsquo;s own marketing never gives
                you.
              </p>
              <div className="mt-6 rounded-lg bg-accent-soft p-5">
                <p className="text-sm font-medium text-accent">Delivery score</p>
                <p className="mt-1 font-display text-5xl font-semibold text-accent">B+</p>
                <p className="mt-2 text-xs leading-relaxed text-ink-soft">
                  Declares 12 perks · 71% average delivery · confirmed by 240 guests
                </p>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
