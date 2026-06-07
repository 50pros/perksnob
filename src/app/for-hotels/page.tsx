import type { Metadata } from "next";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import ClaimFlow from "@/components/claim/ClaimFlow";

export const metadata: Metadata = {
  title: "For hotels — claim your property",
  description:
    "Claim your Marriott property on PerkSnob and declare the elite perks you offer each Bonvoy tier. Free, verified by email, and seen by Marriott's most loyal travelers.",
  alternates: { canonical: "/for-hotels" },
};

const VALUE = [
  [
    "Reach the most loyal travelers",
    "Bonvoy elites are Marriott's highest-spend, most-repeat guests. They check PerkSnob before they book.",
  ],
  [
    "Control your own story",
    "Declare exactly what you offer each tier — instead of letting scattered guest reports speak for you.",
  ],
  [
    "Free, and verified by email",
    "Claiming is free for the property. We verify you with a one-time link to the email already on file.",
  ],
] as const;

export default function ForHotelsPage() {
  return (
    <main className="min-h-screen bg-paper text-ink">
      <Header />
      <section className="mx-auto max-w-content px-6 pb-12 pt-20">
        <p className="text-[13px] font-medium uppercase tracking-eyebrow text-accent">
          For hotels
        </p>
        <h1 className="mt-5 max-w-[18ch] font-display text-5xl font-semibold leading-[1.05] tracking-tight">
          Tell elite guests what you actually offer.
        </h1>
        <p className="mt-6 max-w-prose text-lg leading-relaxed text-ink-soft">
          PerkSnob is a free, volunteer-led registry of Marriott Bonvoy elite benefits.
          Claim your property to publish the perks you give each tier — and stand out to
          the travelers who matter most.
        </p>

        <div className="mt-12 grid gap-8 sm:grid-cols-3">
          {VALUE.map(([t, d]) => (
            <div key={t}>
              <h2 className="font-display text-lg font-semibold">{t}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-line bg-paper-raised">
        <div className="mx-auto max-w-content px-6 py-14">
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            Claim your property
          </h2>
          <p className="mt-2 text-ink-soft">
            Find your hotel and we&rsquo;ll send a verification link to the email on file.
          </p>
          <div className="mt-8 max-w-2xl">
            <ClaimFlow />
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
