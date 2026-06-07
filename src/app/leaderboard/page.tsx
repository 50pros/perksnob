import type { Metadata } from "next";
import { createServerSupabase } from "@/lib/supabase/server";
import type { LeaderboardRow } from "@/lib/types";
import { badgeEmoji } from "@/lib/utils";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Leaderboard | PerkSnob",
  description:
    "Top contributors to PerkSnob's crowdsourced Marriott elite perk database.",
};

function medalEmoji(rank: number): string {
  if (rank === 1) return "\u{1F947}";
  if (rank === 2) return "\u{1F948}";
  if (rank === 3) return "\u{1F949}";
  return "";
}

export default async function LeaderboardPage() {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from("leaderboard")
    .select("*")
    .limit(25);

  const rows = ((data || []) as LeaderboardRow[]).sort(
    (a, b) => b.total_score - a.total_score
  );

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <a
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-8"
        >
          &larr; Back to home
        </a>

        <h1 className="font-[family-name:var(--font-playfair)] text-4xl font-bold tracking-tight text-slate-900">
          Leaderboard
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Top contributors ranked by community score.
        </p>

        {error && (
          <div className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-600">
            Failed to load leaderboard data.
          </div>
        )}

        {rows.length === 0 && !error && (
          <div className="mt-10 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="text-lg font-medium text-slate-700">
              No leaderboard data yet
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Start contributing perk reports to appear on the leaderboard.
            </p>
          </div>
        )}

        {rows.length > 0 && (
          <div className="mt-8 overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    Rank
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    Badge
                  </th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    Perks
                  </th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    Upvotes
                  </th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    Comments
                  </th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    Score
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  const rank = i + 1;
                  const medal = medalEmoji(rank);

                  return (
                    <tr
                      key={row.user_id}
                      className={[
                        "border-b border-slate-100 transition-colors hover:bg-slate-50",
                        rank <= 3 ? "bg-amber-50/40" : "",
                      ].join(" ")}
                    >
                      <td className="px-4 py-3 font-bold text-slate-900">
                        {medal ? (
                          <span className="text-base">{medal}</span>
                        ) : (
                          <span className="text-slate-400">{rank}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <a
                          href={`/profile/${row.user_id}`}
                          className="font-semibold text-slate-900 hover:text-blue-600 transition-colors"
                        >
                          {row.display_name || "Anonymous"}
                        </a>
                        {row.elite_tier && (
                          <span className="ml-2 text-[10px] uppercase text-slate-400">
                            {row.elite_tier}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-xs">
                          <span>{badgeEmoji(row.badge)}</span>
                          <span className="text-[10px] font-medium text-slate-700">
                            {row.badge}
                          </span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-900">
                        {row.perk_count}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">
                        {row.upvote_count}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">
                        {row.comment_count}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-bold text-slate-900">
                          {row.total_score}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
