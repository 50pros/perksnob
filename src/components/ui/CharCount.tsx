"use client";

interface CharCountProps {
  current: number;
  max: number;
}

export default function CharCount({ current, max }: CharCountProps) {
  const isOver = current >= max;

  return (
    <span
      className={[
        "block text-right text-[11px]",
        isOver ? "text-red-500" : "text-slate-400",
      ].join(" ")}
      aria-live="polite"
    >
      {current}/{max}
    </span>
  );
}
