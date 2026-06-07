"use client";

interface PaginationProps {
  current: number;
  total: number;
  onChange: (page: number) => void;
}

function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "...")[] = [];

  if (current <= 3) {
    pages.push(1, 2, 3, 4, "...", total);
  } else if (current >= total - 2) {
    pages.push(1, "...", total - 3, total - 2, total - 1, total);
  } else {
    pages.push(1, "...", current - 1, current, current + 1, "...", total);
  }

  return pages;
}

const btnBase =
  "inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-all";

export default function Pagination({
  current,
  total,
  onChange,
}: PaginationProps) {
  if (total <= 1) return null;

  const pages = getPageNumbers(current, total);

  return (
    <nav aria-label="Pagination" className="flex items-center gap-1">
      <button
        onClick={() => onChange(current - 1)}
        disabled={current <= 1}
        aria-label="Previous page"
        className={[
          btnBase,
          current <= 1
            ? "cursor-not-allowed text-slate-300"
            : "text-slate-700 hover:bg-slate-100",
        ].join(" ")}
      >
        Previous
      </button>

      {pages.map((page, i) =>
        page === "..." ? (
          <span
            key={`ellipsis-${i}`}
            className="px-2 text-sm text-slate-400"
            aria-hidden="true"
          >
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onChange(page)}
            aria-current={page === current ? "page" : undefined}
            aria-label={`Page ${page}`}
            className={[
              btnBase,
              page === current
                ? "bg-slate-900 text-white"
                : "text-slate-700 hover:bg-slate-100",
            ].join(" ")}
          >
            {page}
          </button>
        )
      )}

      <button
        onClick={() => onChange(current + 1)}
        disabled={current >= total}
        aria-label="Next page"
        className={[
          btnBase,
          current >= total
            ? "cursor-not-allowed text-slate-300"
            : "text-slate-700 hover:bg-slate-100",
        ].join(" ")}
      >
        Next
      </button>
    </nav>
  );
}
