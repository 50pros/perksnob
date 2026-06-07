"use client";

import { useState, useEffect } from "react";
import { Sparkles, RefreshCw } from "lucide-react";
import Skeleton from "@/components/ui/Skeleton";

interface AiSummaryCardProps {
  hotelId: string;
  perkCount: number;
}

interface AiSummaryData {
  text: string;
  highlights: string[];
  generated_model?: string;
}

export default function AiSummaryCard({
  hotelId,
  perkCount,
}: AiSummaryCardProps) {
  const [summary, setSummary] = useState<AiSummaryData | null>(null);
  const [status, setStatus] = useState<
    "loading" | "ready" | "not_configured" | "error"
  >("loading");
  const [regenerating, setRegenerating] = useState(false);

  const fetchSummary = async () => {
    try {
      const res = await fetch(
        `/api/ai-summary?hotel_id=${encodeURIComponent(hotelId)}`,
      );
      if (!res.ok) {
        setStatus("error");
        return;
      }
      const data = await res.json();

      if (data.status === "not_configured") {
        setStatus("not_configured");
        return;
      }

      if (data.summary) {
        setSummary(data.summary);
        setStatus("ready");
      } else {
        setStatus("not_configured");
      }
    } catch {
      setStatus("error");
    }
  };

  useEffect(() => {
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotelId]);

  const regenerate = async () => {
    setRegenerating(true);
    try {
      await fetch(`/api/ai-summary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hotel_id: hotelId, regenerate: true }),
      });
      await fetchSummary();
    } catch {
      // silent failure
    }
    setRegenerating(false);
  };

  if (status === "loading") {
    return (
      <div className="mb-5 rounded-[10px] border border-slate-200 bg-white p-5">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-bold text-slate-900">AI Summary</span>
        </div>
        <Skeleton className="mb-2 h-4 w-full" />
        <Skeleton className="mb-2 h-4 w-4/5" />
        <Skeleton className="h-4 w-3/5" />
      </div>
    );
  }

  if (status === "not_configured") {
    return (
      <div className="mb-5 rounded-[10px] border border-slate-200 bg-gradient-to-br from-slate-50 to-amber-50/30 p-5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-400" />
          <span className="text-sm font-bold text-slate-700">AI Summary</span>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          AI summaries will be available soon.{" "}
          {perkCount > 0 &&
            `This hotel has ${perkCount} perk reports to analyze.`}
        </p>
        <span className="mt-2 inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-700">
          Powered by AI
        </span>
      </div>
    );
  }

  if (status === "error" || !summary) return null;

  return (
    <div className="mb-5 rounded-[10px] border border-amber-200 bg-gradient-to-br from-white to-amber-50/30 p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-bold text-slate-900">AI Summary</span>
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-700">
            Powered by AI
          </span>
        </div>
        <button
          onClick={regenerate}
          disabled={regenerating}
          className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-500 transition-colors hover:text-slate-900 disabled:opacity-50"
          title="Regenerate summary"
        >
          <RefreshCw
            className={`h-3 w-3 ${regenerating ? "animate-spin" : ""}`}
          />
          Regenerate
        </button>
      </div>

      <p className="text-[13px] leading-relaxed text-slate-700">
        {summary.text}
      </p>

      {summary.highlights?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {summary.highlights.map((h, i) => (
            <span
              key={i}
              className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-semibold text-amber-800"
            >
              {h}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
