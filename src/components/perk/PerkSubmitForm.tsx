"use client";

import { useState, useRef, useCallback } from "react";
import { TIERS, CATS, BOOKING_TYPES, UPGRADE_TYPES, MAX_DESC } from "@/lib/constants";
import { sanitize, hasProfanity, displayName, perkOutcome } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import CategoryDetailFields from "./CategoryDetailFields";
import CharCount from "@/components/ui/CharCount";

interface PerkEntry {
  category: string;
  description: string;
  upgrade_type: string;
  category_details: Record<string, any>;
  report_outcome: string;
}

interface PerkSubmitFormProps {
  hotelId: string;
  user: any;
  onSuccess: () => void;
  onNeedAuth: () => void;
}

export default function PerkSubmitForm({
  hotelId,
  user,
  onSuccess,
  onNeedAuth,
}: PerkSubmitFormProps) {
  const emptyEntry = (): PerkEntry => ({
    category: "",
    description: "",
    upgrade_type: "",
    category_details: {},
    report_outcome: "received",
  });

  const [open, setOpen] = useState(false);
  const [tier, setTier] = useState("");
  const [stayDate, setStayDate] = useState("");
  const [bookingType, setBookingType] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [entries, setEntries] = useState<PerkEntry[]>([emptyEntry()]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const lastSub = useRef(0);

  const updateEntry = (i: number, field: string, val: any) => {
    const next = [...entries];
    next[i] = { ...next[i], [field]: val };
    setEntries(next);
  };

  const addEntry = () => setEntries([...entries, emptyEntry()]);

  const removeEntry = (i: number) => {
    if (entries.length <= 1) return;
    setEntries(entries.filter((_, j) => j !== i));
  };

  const resetForm = () => {
    setTier("");
    setStayDate("");
    setBookingType("");
    setPromoCode("");
    setEntries([emptyEntry()]);
    setOpen(false);
    setError("");
  };

  const submit = async () => {
    if (!user) {
      onNeedAuth();
      return;
    }

    const valid = entries.filter((e) => e.category && e.description.trim());

    if (!tier) {
      setError("Please select your tier");
      return;
    }
    if (!valid.length) {
      setError("Please add at least one category with a description");
      return;
    }

    for (const e of valid) {
      if (e.description.trim().length > MAX_DESC) {
        setError(`Description must be ${MAX_DESC} characters or less`);
        return;
      }
      if (hasProfanity(e.description)) {
        setError("Your report contains inappropriate language. Please revise.");
        return;
      }
    }

    const now = Date.now();
    if (now - lastSub.current < 10000) {
      setError("Please wait a few seconds between submissions");
      return;
    }

    setSubmitting(true);
    setError("");

    const supabase = createClient();
    const dName = displayName(user);

    const rows = valid.map((e) => {
      const row: Record<string, any> = {
        hotel_id: hotelId,
        user_id: user.id,
        display_name: dName,
        elite_tier: tier,
        category: e.category,
        description: sanitize(e.description) || "",
      };

      if (stayDate) row.stay_date = stayDate + "-01";
      if (bookingType) row.booking_type = bookingType;
      if (promoCode.trim()) row.promo_code = sanitize(promoCode);
      if (e.category === "upgrade" && e.upgrade_type) {
        row.upgrade_type = e.upgrade_type;
      }

      const cd = Object.fromEntries(
        Object.entries(e.category_details || {}).filter(
          ([_, v]) => v !== undefined && v !== "" && v !== 0,
        ),
      );
      (cd as any).report_outcome =
        e.report_outcome === "not_received" ? "not_received" : "received";
      if (Object.keys(cd).length) row.category_details = cd;

      return row;
    });

    const { error: insertError } = await supabase
      .from("perk_reports")
      .insert(rows);

    if (insertError) {
      setError("Error: " + insertError.message);
      setSubmitting(false);
      return;
    }

    lastSub.current = now;
    setSubmitting(false);
    resetForm();
    onSuccess();
  };

  const validCount = entries.filter(
    (e) => e.category && e.description.trim(),
  ).length;

  return (
    <div className="rounded-[10px] border border-slate-800 bg-slate-900 p-7">
      {open && (
        <div className="mb-5 flex items-center justify-between">
          <h3 className="m-0 font-serif text-xl font-bold text-white">
            Report Your Stay
          </h3>
          <button
            onClick={resetForm}
            className="border-none bg-transparent p-1 text-xl leading-none text-slate-400 hover:text-white"
          >
            &times;
          </button>
        </div>
      )}

      {!open && (
        <h3 className="mb-2 font-serif text-lg font-bold text-white">
          Report Your Stay
        </h3>
      )}

      <p className="mb-4 text-xs text-slate-400">
        Share what was provided and what was not. This directly powers the
        likelihood scores above.
      </p>

      {error && (
        <div className="mb-3 rounded-md bg-red-50 px-3.5 py-2.5 text-xs text-red-600">
          {error}
        </div>
      )}

      <div
        onClick={() => {
          if (!user && !open) onNeedAuth();
        }}
      >
        {/* Top-level fields */}
        <div className="mb-5 flex flex-wrap gap-3.5">
          <div className="min-w-[160px] flex-[1_1_160px]">
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Your Tier
            </label>
            <select
              value={tier}
              onChange={(e) => {
                if (!user) {
                  onNeedAuth();
                  return;
                }
                setTier(e.target.value);
                if (!open) setOpen(true);
              }}
              className="w-full rounded-md border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none"
            >
              <option value="">Select...</option>
              {TIERS.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-[200px] flex-[1_1_200px]">
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              When did you stay?
            </label>
            <input
              type="month"
              value={stayDate}
              onChange={(e) => {
                if (!user) {
                  onNeedAuth();
                  return;
                }
                setStayDate(e.target.value);
                if (!open) setOpen(true);
              }}
              className="w-full rounded-md border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none"
            />
          </div>

          <div className="min-w-[180px] flex-[1_1_180px]">
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Booking Type{" "}
              <span className="font-normal normal-case">(optional)</span>
            </label>
            <select
              value={bookingType}
              onChange={(e) => {
                if (!user) {
                  onNeedAuth();
                  return;
                }
                setBookingType(e.target.value);
                if (!open) setOpen(true);
              }}
              className="w-full rounded-md border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none"
            >
              <option value="">Select...</option>
              {BOOKING_TYPES.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-[180px] flex-[1_1_180px]">
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Promo/Corp Code{" "}
              <span className="font-normal normal-case">(optional)</span>
            </label>
            <input
              value={promoCode}
              onChange={(e) => {
                if (!user) {
                  onNeedAuth();
                  return;
                }
                setPromoCode(e.target.value.slice(0, 30));
                if (!open) setOpen(true);
              }}
              placeholder="e.g. MMP"
              maxLength={30}
              className="w-full rounded-md border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none"
              onFocus={() => {
                if (!user) onNeedAuth();
              }}
            />
          </div>
        </div>

        {/* Entries */}
        {open &&
          entries.map((entry, i) => (
            <div
              key={i}
              className="relative mb-3 rounded-lg border border-slate-700 bg-slate-800 p-5"
            >
              <div className="mb-3.5 flex items-center justify-between">
                <span className="text-[13px] font-bold text-slate-200">
                  Perk {entries.length > 1 ? `#${i + 1}` : ""}
                </span>
                {entries.length > 1 && (
                  <button
                    onClick={() => removeEntry(i)}
                    aria-label="Remove this perk"
                    className="border-none bg-transparent p-0 text-lg leading-none text-red-300 hover:text-red-400"
                  >
                    &times;
                  </button>
                )}
              </div>

              {/* Category select */}
              <div className="mb-3 flex flex-wrap gap-3.5">
                <div className="min-w-[180px] flex-[1_1_180px]">
                  <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Category
                  </label>
                  <select
                    value={entry.category}
                    onChange={(e) => {
                      const next = [...entries];
                      next[i] = {
                        ...next[i],
                        category: e.target.value,
                        category_details: {},
                      };
                      setEntries(next);
                    }}
                    className="w-full rounded-md border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none"
                  >
                    <option value="">Select...</option>
                    {CATS.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.icon} {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Received/Not received toggle */}
              {entry.category && (
                <div className="mb-3">
                  <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Did you receive this perk?
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        updateEntry(i, "report_outcome", "received")
                      }
                      className={[
                        "rounded-md border px-3 py-1.5 text-[11px] font-bold transition-colors",
                        entry.report_outcome !== "not_received"
                          ? "border-green-300 bg-green-100 text-green-800"
                          : "border-slate-200 bg-white text-slate-600",
                      ].join(" ")}
                    >
                      Yes, received
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateEntry(i, "report_outcome", "not_received")
                      }
                      className={[
                        "rounded-md border px-3 py-1.5 text-[11px] font-bold transition-colors",
                        entry.report_outcome === "not_received"
                          ? "border-red-200 bg-red-100 text-red-700"
                          : "border-slate-200 bg-white text-slate-600",
                      ].join(" ")}
                    >
                      No, did not receive
                    </button>
                  </div>
                </div>
              )}

              {/* Upgrade type */}
              {entry.category === "upgrade" && (
                <div className="mb-3">
                  <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Upgrade Type
                  </label>
                  <select
                    value={entry.upgrade_type || ""}
                    onChange={(e) =>
                      updateEntry(i, "upgrade_type", e.target.value)
                    }
                    className="w-full rounded-md border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none"
                  >
                    <option value="">Select type...</option>
                    {UPGRADE_TYPES.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Category detail fields */}
              {entry.category && (
                <CategoryDetailFields
                  category={entry.category as any}
                  details={entry.category_details || {}}
                  onChange={(cd) => updateEntry(i, "category_details", cd)}
                />
              )}

              {/* Description */}
              <div>
                <label className="mb-1.5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  <span>
                    {entry.report_outcome === "not_received"
                      ? "What happened instead?"
                      : "Describe the perk"}
                  </span>
                  <CharCount
                    current={entry.description.length}
                    max={MAX_DESC}
                  />
                </label>
                <textarea
                  value={entry.description}
                  onChange={(e) =>
                    updateEntry(
                      i,
                      "description",
                      e.target.value.slice(0, MAX_DESC),
                    )
                  }
                  placeholder={
                    entry.report_outcome === "not_received"
                      ? "e.g., Requested late checkout and was denied at check-in"
                      : "e.g., Full hot buffet at the main restaurant, free for all Platinum+"
                  }
                  maxLength={MAX_DESC}
                  className="min-h-[70px] w-full resize-y rounded-md border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none"
                />
              </div>
            </div>
          ))}

        {/* Add another + Submit */}
        {open && (
          <>
            <button
              onClick={addEntry}
              className="mb-4 w-full rounded-lg border-2 border-dashed border-slate-700 bg-transparent px-5 py-3 text-[13px] font-semibold text-slate-300 transition-colors hover:border-slate-500"
            >
              + Add another category
            </button>

            <div className="flex gap-2">
              <button
                onClick={submit}
                disabled={submitting}
                className="rounded-md bg-white px-5 py-2.5 text-sm font-bold text-slate-900 transition-opacity disabled:opacity-50"
              >
                {submitting
                  ? "..."
                  : `Submit ${validCount || ""} Perk${validCount !== 1 ? "s" : ""}`}
              </button>
              <button
                onClick={resetForm}
                className="rounded-md bg-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-600"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
