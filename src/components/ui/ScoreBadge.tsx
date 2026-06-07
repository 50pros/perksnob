"use client";

interface ScoreBadgeProps {
  score: number;
}

function getScoreColor(score: number): string {
  if (score >= 70) return "bg-green-100 text-score-green";
  if (score >= 40) return "bg-amber-100 text-score-amber";
  return "bg-red-100 text-score-red";
}

export default function ScoreBadge({ score }: ScoreBadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-md px-2 py-1",
        getScoreColor(score),
      ].join(" ")}
    >
      <span className="text-sm font-bold">{score}</span>
      <span className="text-[10px] font-medium uppercase tracking-wide opacity-70">
        score
      </span>
    </span>
  );
}
