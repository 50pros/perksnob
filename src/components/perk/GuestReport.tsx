"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CATS, TIERS, CATEGORY_FIELDS } from "@/lib/constants";
import type { PerkCategory } from "@/lib/types";

const fieldCls =
  "mt-1 w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-base text-ink outline-none transition-colors placeholder:text-ink-soft focus:border-ink";

type Details = Record<string, string>;

/** Lets a signed-in guest post what elite perks they received, with the
 *  per-category detail questions from the original platform. Writes to
 *  perk_reports (description + category_details jsonb). */
export default function GuestReport({
  hotelId,
  slug,
}: {
  hotelId: string;
  slug: string;
}) {
  const { user } = useAuth();
  const [sb] = useState(() => createClient());
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<PerkCategory>("breakfast");
  const [tier, setTier] = useState("titanium");
  const [details, setDetails] = useState<Details>({});
  const [desc, setDesc] = useState("");
  const [name, setName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let active = true;
    sb.from("user_profiles")
      .select("display_name, elite_tier")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        if (data?.display_name) setName(data.display_name);
        if (data?.elite_tier) setTier(data.elite_tier as string);
      });
    return () => {
      active = false;
    };
  }, [user, sb]);

  function changeCategory(c: PerkCategory) {
    setCategory(c);
    setDetails({});
  }
  function setDetail(key: string, value: string) {
    setDetails((d) => ({ ...d, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || busy) return;
    const text = desc.trim();
    if (text.length < 3) {
      setErr("Please add a few words about what you received.");
      return;
    }
    setBusy(true);
    setErr(null);
    const clean: Details = {};
    for (const [k, v] of Object.entries(details)) if (v) clean[k] = v;
    const { error } = await sb.from("perk_reports").insert({
      hotel_id: hotelId,
      user_id: user.id,
      display_name: name || user.email?.split("@")[0] || "Guest",
      elite_tier: tier,
      category,
      description: text,
      category_details: Object.keys(clean).length ? clean : null,
    });
    setBusy(false);
    if (error) {
      setErr(
        error.message.toLowerCase().includes("rate")
          ? "You're posting a lot quickly — please wait a moment and try again."
          : "Couldn't submit your report. Please try again.",
      );
      return;
    }
    setDone(true);
    setDesc("");
    setDetails({});
  }

  if (!user) {
    return (
      <div className="mt-6 rounded-xl border border-line bg-paper-raised p-5">
        <p className="text-sm leading-relaxed text-ink-soft">
          Stayed here?{" "}
          <Link
            href={`/signin?next=/hotel/${slug}`}
            className="font-medium text-accent underline underline-offset-2"
          >
            Sign in
          </Link>{" "}
          to share the elite perks you received and help other Bonvoy members.
        </p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="mt-6 rounded-xl border border-delivered/40 bg-delivered/10 p-5">
        <p className="text-sm font-medium text-delivered">
          Thanks — your report is live. It may take a moment to appear below.
        </p>
        <button
          onClick={() => setDone(false)}
          className="mt-1.5 text-sm text-ink-soft underline-offset-2 hover:text-ink hover:underline"
        >
          Add another
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-6 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-accent"
      >
        Share what you received →
      </button>
    );
  }

  const catFields = (CATEGORY_FIELDS[category] ?? []).filter(
    (f) => !f.showIf || f.showIf(details),
  );

  return (
    <form
      onSubmit={submit}
      className="mt-6 rounded-xl border border-line bg-paper-raised p-6"
    >
      <p className="font-display text-lg font-semibold">Share your experience</p>
      <p className="mt-0.5 text-sm text-ink-soft">
        Reporting as {name || "you"} — what did you receive as an elite member?
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-ink-soft">Perk</span>
          <select
            value={category}
            onChange={(e) => changeCategory(e.target.value as PerkCategory)}
            className={fieldCls}
          >
            {CATS.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-ink-soft">Your tier</span>
          <select
            value={tier}
            onChange={(e) => setTier(e.target.value)}
            className={fieldCls}
          >
            {TIERS.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        {catFields.map((f) => (
          <label key={f.key} className="block text-sm">
            <span className="text-ink-soft">{f.label}</span>
            {f.type === "select" ? (
              <select
                value={details[f.key] ?? ""}
                onChange={(e) => setDetail(f.key, e.target.value)}
                className={fieldCls}
              >
                <option value="">—</option>
                {f.options?.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            ) : f.type === "rating" ? (
              <select
                value={details[f.key] ?? ""}
                onChange={(e) => setDetail(f.key, e.target.value)}
                className={fieldCls}
              >
                <option value="">—</option>
                {Array.from({ length: f.max ?? 5 }, (_, i) => String(i + 1)).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={details[f.key] ?? ""}
                onChange={(e) => setDetail(f.key, e.target.value)}
                placeholder={f.placeholder}
                className={fieldCls}
              />
            )}
          </label>
        ))}
      </div>
      <textarea
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        rows={3}
        maxLength={500}
        placeholder="Anything else? e.g. Full breakfast in the main restaurant, suite upgrade offered at check-in, 4 PM late checkout…"
        className={`${fieldCls} mt-3 resize-y`}
      />
      {err && <p className="mt-2 text-sm text-disputed">{err}</p>}
      <div className="mt-4 flex items-center gap-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-accent disabled:opacity-60"
        >
          {busy ? "Posting…" : "Post report"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-2 text-sm text-ink-soft hover:text-ink"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
