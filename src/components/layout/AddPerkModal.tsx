"use client";

import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import type { Hotel } from "@/lib/types";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

interface AddPerkModalProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
  hotels: Hotel[];
  onSelect: (hotel: Hotel) => void;
  onRequestHotel: (name: string) => void;
}

export default function AddPerkModal({
  open,
  onClose,
  user,
  hotels,
  onSelect,
  onRequestHotel,
}: AddPerkModalProps) {
  const [query, setQuery] = useState("");

  const matches =
    query.trim().length < 2
      ? []
      : hotels
          .filter((h) => {
            const words = query
              .toLowerCase()
              .split(/\s+/)
              .filter((w) => w.length > 1);
            const hay = [h.name, h.location, h.region || "", h.brand]
              .join(" ")
              .toLowerCase();
            return words.every((w) => hay.includes(w));
          })
          .slice(0, 8);

  if (!user) {
    return (
      <Modal open={open} onClose={onClose} title="Add a Perk">
        <p className="mb-5 text-sm text-slate-500">
          Sign in to submit perk reports for hotels.
        </p>
        <Button onClick={onClose} className="w-full">
          Close
        </Button>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="mb-1 font-serif text-2xl font-bold text-slate-900">
        Add a Perk
      </h2>
      <p className="mb-5 text-[13px] text-slate-400">
        Search for a hotel to submit your perk report.
      </p>

      {/* Search input */}
      <div className="relative mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search hotels..."
          autoFocus
          className="w-full rounded-md border border-slate-200 bg-white px-4 py-3.5 text-[15px] text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 border-none bg-transparent text-base text-slate-400 hover:text-slate-600"
            aria-label="Clear search"
          >
            &times;
          </button>
        )}
      </div>

      {/* Results */}
      <div className="max-h-[50vh] min-h-0 overflow-y-auto">
        {/* No query yet */}
        {!query.trim() && (
          <div className="py-5 text-center">
            <div className="mb-2 text-3xl">&#x1F3E8;</div>
            <p className="text-xs text-slate-400">
              Start typing to find your hotel
            </p>
          </div>
        )}

        {/* No results */}
        {query.trim().length >= 2 && matches.length === 0 && (
          <div className="py-5 text-center text-[13px] text-slate-400">
            <div className="mb-2.5">
              No hotels found matching &ldquo;{query}&rdquo;
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onRequestHotel(query.trim())}
            >
              Request this hotel
            </Button>
          </div>
        )}

        {/* Hotel matches */}
        {matches.map((h) => (
          <div
            key={h.id}
            onClick={() => {
              onSelect(h);
              onClose();
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onSelect(h);
                onClose();
              }
            }}
            className="flex cursor-pointer items-center justify-between rounded-md border-b border-slate-100 px-3.5 py-3 transition-colors hover:bg-slate-50"
          >
            <div>
              <div className="text-sm font-semibold text-slate-900">
                {h.name}
              </div>
              <div className="text-[11px] text-slate-400">
                {h.brand} &middot; {h.location}
              </div>
            </div>
            <span className="text-xs text-slate-400">&rarr;</span>
          </div>
        ))}
      </div>
    </Modal>
  );
}
