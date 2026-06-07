import Link from "next/link";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";

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

export default function HomePage() {
  return (
    <main className="min-h-screen bg-paper text-ink">
      <Header />

      {/* Hero --------------------------------------------------------------- */}
      <section className="mx-auto max-w-content px-6 pb-16 pt-20">
        <p className="text-[13px] font-medium uppercase tracking-eyebrow text-accent">
          The elite benefits registry
        </p>
        <h1 className="mt-5 max-w-[15ch] font-display text-5xl font-semibold leading-[1.04] tracking-tight sm:text-6xl">
          What Marriott elites <span className="italic">actually</span> get.
        </h1>
        <p className="mt-6 max-w-prose text-lg leading-relaxed text-ink-soft">
          Hotels declare the perks they offer each elite tier. Guests confirm what they
          really received. The gap between the two is the truth — and it lives here.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="/hotels"
            className="rounded-full bg-ink px-6 py-3 text-sm font-medium text-paper transition-colors hover:bg-accent"
          >
            Browse 8,982 properties
          </Link>
          <Link
            href="/for-hotels"
            className="rounded-full border border-line px-6 py-3 text-sm font-medium text-ink transition-colors hover:border-ink"
          >
            Claim your hotel →
          </Link>
        </div>

        <dl className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-4">
          {[
            ["8,982", "Properties"],
            ["18", "Perk categories"],
            ["5", "Elite tiers"],
            ["Free", "Community-led"],
          ].map(([n, l]) => (
            <div key={l} className="bg-paper px-5 py-6">
              <dt className="font-display text-3xl font-semibold">{n}</dt>
              <dd className="mt-1 text-sm text-ink-soft">{l}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Specimen: claimed vs delivered ------------------------------------- */}
      <section className="border-t border-line bg-paper-raised">
        <div className="mx-auto max-w-content px-6 py-16">
          <p className="text-[13px] font-medium uppercase tracking-eyebrow text-ink-soft">
            A property at a glance
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
                When a hotel claims a perk guests routinely don&rsquo;t receive, the gap
                shows. That&rsquo;s the signal Marriott&rsquo;s own marketing will never
                give you.
              </p>
              <div className="mt-6 rounded-lg bg-accent-soft p-5">
                <p className="text-sm font-medium text-accent">Delivery score</p>
                <p className="mt-1 font-display text-5xl font-semibold text-accent">B+</p>
                <p className="mt-2 text-xs leading-relaxed text-ink-soft">
                  Declares 12 perks · 71% average delivery · confirmed by 240 guests ·
                  updated 3 days ago
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
