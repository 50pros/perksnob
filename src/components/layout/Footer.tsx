import Link from "next/link";

interface FooterProps {
  onAddHotel: () => void;
}

export default function Footer({ onAddHotel }: FooterProps) {
  return (
    <footer className="mt-10 border-t border-slate-800 bg-slate-900 px-7 py-10">
      <div className="mx-auto flex max-w-[1100px] flex-wrap items-start justify-between gap-6">
        {/* Brand */}
        <div>
          <div className="mb-2 flex items-baseline gap-0.5">
            <span className="font-serif text-xl font-bold text-white">
              Perk
            </span>
            <span className="font-serif text-xl font-bold text-slate-400">
              Snob
            </span>
          </div>
          <p className="max-w-[280px] text-xs leading-relaxed text-slate-500">
            Real Marriott Bonvoy elite benefits reported by real guests. Powered
            by the community!
          </p>
        </div>

        <div className="flex gap-8">
          {/* Navigate */}
          <div>
            <div className="mb-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Navigate
            </div>
            {[
              { label: "Home", href: "/" },
              { label: "Search Perks", href: "/search" },
              { label: "Compare", href: "/compare" },
              { label: "Following", href: "/following" },
              { label: "Leaderboard", href: "/leaderboard" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="mb-1.5 block text-[13px] text-slate-500 no-underline transition-colors hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Community */}
          <div>
            <div className="mb-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Community
            </div>
            <a
              href="https://www.reddit.com/r/marriott/"
              target="_blank"
              rel="noopener noreferrer"
              className="mb-1.5 block text-[13px] text-slate-500 no-underline transition-colors hover:text-white"
            >
              r/marriott
            </a>
            <a
              href="https://www.reddit.com/user/MarriottGuy/"
              target="_blank"
              rel="noopener noreferrer"
              className="mb-2.5 block text-[13px] text-slate-500 no-underline transition-colors hover:text-white"
            >
              Contact (Reddit)
            </a>
            <button
              onClick={onAddHotel}
              className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-900 transition-colors hover:bg-slate-100"
            >
              + Add Hotel
            </button>
          </div>
        </div>
      </div>

      {/* Bottom disclaimer */}
      <div className="mx-auto mt-5 max-w-[1100px] border-t border-slate-800 pt-5">
        <p className="text-[11px] text-slate-600">
          PerkSnob is not affiliated with Marriott International. All trademarks
          belong to their respective owners.
        </p>
      </div>
    </footer>
  );
}
