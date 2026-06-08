import type { Metadata } from "next";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with PerkSnob — a free, volunteer-led project from the r/marriott community.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-paper text-ink">
      <Header />
      <div className="mx-auto max-w-content px-6 py-12">
        <p className="text-[13px] font-medium uppercase tracking-eyebrow text-accent">
          Contact
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          Get in touch
        </h1>
        <p className="mt-4 max-w-prose text-lg leading-relaxed text-ink-soft">
          PerkSnob is a free, volunteer-led project from the r/marriott community. The best
          way to reach us is on Reddit — post in the community or send a message, and we will
          reply there.
        </p>

        <div className="mt-8 grid max-w-xl gap-4">
          <a
            href="https://www.reddit.com/r/marriott/"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-line bg-paper-raised p-6 transition-colors hover:border-accent"
          >
            <p className="font-display text-lg font-semibold">r/marriott on Reddit</p>
            <p className="mt-1 text-sm text-ink-soft">
              Reach the community of 140,000+ Marriott Bonvoy members. →
            </p>
          </a>
        </div>

        <div className="mt-10 max-w-prose rounded-xl border border-line bg-paper-raised p-6">
          <p className="font-medium">Are you a hotel?</p>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
            Listings are added by the community and claimed by invitation only. If you
            received an invitation email for your property, use the private link inside it to
            claim and complete your profile.
          </p>
        </div>
      </div>
      <Footer />
    </main>
  );
}
