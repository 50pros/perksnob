"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const fieldCls =
  "mt-1 w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-base text-ink outline-none transition-colors placeholder:text-ink-soft focus:border-ink";

/** Lets a signed-in user request a Marriott property that's missing from the
 *  directory. Writes to hotel_requests for admin review. */
export default function RequestHotel() {
  const { user } = useAuth();
  const [sb] = useState(() => createClient());
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [brand, setBrand] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || busy) return;
    const hotel_name = name.trim();
    if (hotel_name.length < 3) {
      setErr("Please enter the hotel's name.");
      return;
    }
    setBusy(true);
    setErr(null);
    const { error } = await sb.from("hotel_requests").insert({
      user_id: user.id,
      hotel_name,
      city: city.trim() || null,
      brand: brand.trim() || null,
      notes: notes.trim() || null,
      status: "pending",
    });
    setBusy(false);
    if (error) {
      setErr("Couldn't submit your request. Please try again.");
      return;
    }
    setDone(true);
    setName("");
    setCity("");
    setBrand("");
    setNotes("");
  }

  if (done) {
    return (
      <div className="rounded-xl border border-delivered/40 bg-delivered/10 p-6">
        <p className="font-display text-lg font-semibold text-delivered">
          Request received.
        </p>
        <p className="mt-1 text-sm text-ink-soft">
          Thanks — we&rsquo;ll review it and add the property to the directory.
        </p>
        <button
          onClick={() => setDone(false)}
          className="mt-2 text-sm text-ink-soft underline-offset-2 hover:text-ink hover:underline"
        >
          Request another
        </button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-xl border border-line bg-paper-raised p-6">
        <p className="font-display text-lg font-semibold">Don&rsquo;t see your property?</p>
        <p className="mt-1 text-sm text-ink-soft">
          <Link
            href="/signin?next=/hotels"
            className="font-medium text-accent underline underline-offset-2"
          >
            Sign in
          </Link>{" "}
          to request a Marriott Bonvoy hotel be added to the directory.
        </p>
      </div>
    );
  }

  if (!open) {
    return (
      <div className="rounded-xl border border-line bg-paper-raised p-6">
        <p className="font-display text-lg font-semibold">Don&rsquo;t see your property?</p>
        <p className="mt-1 text-sm text-ink-soft">
          Tell us which Marriott Bonvoy hotel is missing and we&rsquo;ll add it.
        </p>
        <button
          onClick={() => setOpen(true)}
          className="mt-4 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-accent"
        >
          Request a hotel →
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-line bg-paper-raised p-6">
      <p className="font-display text-lg font-semibold">Request a hotel</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block text-sm sm:col-span-2">
          <span className="text-ink-soft">Hotel name *</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sheraton Music City Nashville Airport"
            className={fieldCls}
          />
        </label>
        <label className="block text-sm">
          <span className="text-ink-soft">City</span>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g. Nashville"
            className={fieldCls}
          />
        </label>
        <label className="block text-sm">
          <span className="text-ink-soft">Brand</span>
          <input
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="e.g. Sheraton"
            className={fieldCls}
          />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="text-ink-soft">Anything else? (optional)</span>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="A Marriott.com link, location detail, etc."
            className={fieldCls}
          />
        </label>
      </div>
      {err && <p className="mt-2 text-sm text-disputed">{err}</p>}
      <div className="mt-4 flex items-center gap-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-accent disabled:opacity-60"
        >
          {busy ? "Submitting…" : "Submit request"}
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
