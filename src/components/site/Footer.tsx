import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-20 bg-ink text-paper">
      <div className="mx-auto max-w-content px-6 py-16">
        <div className="grid gap-10 sm:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <span className="font-display text-2xl font-semibold tracking-tight">
              <span className="text-paper">Perk</span>
              <span className="text-paper/45">Snob</span>
            </span>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-paper/55">
              PerkSnob is a directory platform for Marriott Bonvoy Elite guests to discover,
              browse, search, and find what perks &amp; benefits hotel properties provide.
              Powered by the community.
            </p>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-eyebrow text-paper/40">
              Navigate
            </p>
            <ul className="mt-4 space-y-2.5 text-sm text-paper/70">
              <li><Link href="/" className="transition-colors hover:text-paper">Home</Link></li>
              <li><Link href="/hotels" className="transition-colors hover:text-paper">Hotels</Link></li>
              <li><Link href="/brands" className="transition-colors hover:text-paper">Brands</Link></li>
              <li><Link href="/how-it-works" className="transition-colors hover:text-paper">How it works</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-eyebrow text-paper/40">
              Community
            </p>
            <ul className="mt-4 space-y-2.5 text-sm text-paper/70">
              <li>
                <a href="https://www.reddit.com/r/marriott/" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-paper">
                  r/marriott
                </a>
              </li>
              <li>
                <a href="https://www.reddit.com/r/marriott/" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-paper">
                  Contact (Reddit)
                </a>
              </li>
              <li><Link href="/for-hotels" className="transition-colors hover:text-paper">For hotels</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-paper/10 pt-6 text-xs text-paper/40">
          <p>PerkSnob is a free, volunteer-led project from the Marriott Bonvoy community.</p>
          <p className="mt-1">
            Not affiliated with or endorsed by Marriott International. All trademarks belong
            to their respective owners.
          </p>
        </div>
      </div>
    </footer>
  );
}
