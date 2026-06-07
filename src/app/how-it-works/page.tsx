import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "How PerkSnob works: hotels declare the elite perks they offer each Marriott Bonvoy tier, guests confirm what they actually received, and the gap between the two is the truth.",
  alternates: { canonical: "/how-it-works" },
};

const STEPS = [
  [
    "Hotels declare",
    "A property states exactly which perks it offers each elite tier — breakfast, lounge, upgrades, late checkout, and more. Verified by a one-time link to the email on file.",
  ],
  [
    "Guests verify",
    "Titanium, Platinum, and Ambassador Elites confirm or dispute each declared perk based on what they actually received on their stay.",
  ],
  [
    "The gap is the truth",
    "Every perk shows a delivery rate — how often guests really get it. A hotel can claim anything; the community keeps it honest.",
  ],
];

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-paper text-ink">
      <Header />
      <div className="mx-auto max-w-content px-6 py-16">
        <p className="text-[13px] font-medium uppercase tracking-eyebrow text-accent">
          How it works
        </p>
        <h1 className="mt-3 max-w-[18ch] font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Declared by hotels. Verified by guests.
        </h1>
        <p className="mt-5 max-w-prose text-lg leading-relaxed text-ink-soft">
          PerkSnob is a free, community-led directory of Marriott Bonvoy elite benefits.
          Instead of guessing what you&rsquo;ll get, see what a property promises — and how
          reliably it delivers.
        </p>

        <div className="mt-14 grid gap-10 sm:grid-cols-3">
          {STEPS.map(([t, d], i) => (
            <div key={t}>
              <p className="font-display text-3xl font-semibold text-accent">{i + 1}</p>
              <h2 className="mt-2 font-display text-lg font-semibold">{t}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{d}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-xl border border-line bg-paper-raised p-7">
          <h3 className="font-display text-xl font-semibold">Built for elite travelers</h3>
          <p className="mt-2 max-w-prose text-sm leading-relaxed text-ink-soft">
            Made by and for the Marriott Bonvoy community on{" "}
            <a
              href="https://www.reddit.com/r/marriott/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline underline-offset-2"
            >
              r/marriott
            </a>
            . It&rsquo;s 100% free and not affiliated with Marriott International.
          </p>
          <Link
            href="/hotels"
            className="mt-5 inline-block rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-accent"
          >
            Browse properties →
          </Link>
        </div>
      </div>
      <Footer />
    </main>
  );
}
