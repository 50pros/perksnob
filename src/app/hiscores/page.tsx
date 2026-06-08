import type { Metadata } from "next";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import { Gift } from "lucide-react";
import { getLeaderboard } from "@/lib/data";

export const revalidate = 3600;

const PRIZES = [
  "Wins a 2-night stay at any Ritz Carlton (max $1,000)",
  "Wins a 2-night stay at any Westin (max $750)",
  "Wins a 2-night stay at any Courtyard (max $250)",
];

export const metadata: Metadata = {
  title: "Hiscores — top PerkSnob contributors",
  description:
    "The top contributors to PerkSnob — the guests who have reported the most Marriott Bonvoy elite perks for the community.",
  alternates: { canonical: "/hiscores" },
};

export default async function HiscoresPage() {
  const rows = await getLeaderboard(3);

  return (
    <main className="min-h-screen bg-paper text-ink">
      <Header />
      <div className="mx-auto max-w-content px-6 py-12">
        <p className="text-[13px] font-medium uppercase tracking-eyebrow text-accent">
          Community Hiscores
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          Top contributors
        </h1>
        <p className="mt-3 max-w-prose text-ink-soft">
          The guests who have reported the most elite perks — the people who make PerkSnob
          worth reading. Thank you.
        </p>

        <div className="mt-10 max-w-2xl overflow-hidden rounded-xl border border-line">
          {rows.length === 0 ? (
            <p className="p-12 text-center text-ink-soft">The leaderboard is warming up.</p>
          ) : (
            <ul>
              {rows.map((r, i) => (
                <li
                  key={`${r.display_name}-${i}`}
                  className="flex items-center gap-4 border-b border-line px-5 py-4 last:border-b-0 sm:px-6"
                >
                  <span
                    className={`w-7 shrink-0 text-center font-display text-xl font-semibold ${i < 3 ? "text-accent" : "text-ink-soft"}`}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{r.display_name}</p>
                    {r.badge && <p className="text-xs text-ink-soft">{r.badge}</p>}
                    {PRIZES[i] && (
                      <p className="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-accent">
                        <Gift className="h-4 w-4 shrink-0" aria-hidden />
                        {PRIZES[i]}
                      </p>
                    )}
                  </div>
                  <div className="hidden w-20 shrink-0 text-right sm:block">
                    <p className="font-medium">{r.hotels_covered}</p>
                    <p className="text-xs text-ink-soft">hotels</p>
                  </div>
                  <div className="w-20 shrink-0 text-right">
                    <p className="font-display text-lg font-semibold">
                      {r.total_reports.toLocaleString("en-US")}
                    </p>
                    <p className="text-xs text-ink-soft">
                      report{r.total_reports === 1 ? "" : "s"}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="mt-6 max-w-prose text-sm text-ink-soft">
          Rankings are based on verified guest perk reports across the directory.
        </p>
      </div>
      <Footer />
    </main>
  );
}
