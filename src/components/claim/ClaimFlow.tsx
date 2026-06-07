"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Hit {
  id: string;
  slug: string;
  name: string;
  brand: string;
  location: string;
}

const inputCls =
  "w-full rounded-lg border border-line bg-paper px-4 py-3 text-base text-ink outline-none transition-colors placeholder:text-ink-soft focus:border-ink";

export default function ClaimFlow() {
  const { user, loading } = useAuth();
  const sb = useRef(createClient());

  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [selected, setSelected] = useState<Hit | null>(null);

  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [result, setResult] = useState<{ maskedEmail: string; devLink?: string } | null>(
    null,
  );

  useEffect(() => {
    const term = q.trim();
    if (selected || term.length < 2) {
      setHits([]);
      return;
    }
    let active = true;
    const t = setTimeout(async () => {
      const { data } = await sb.current
        .from("hotel_directory")
        .select("id,slug,name,brand,location")
        .ilike("name", `%${term}%`)
        .order("report_count", { ascending: false })
        .limit(8);
      if (active) setHits((data ?? []) as Hit[]);
    }, 200);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [q, selected]);

  async function doAuth(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    setNotice(null);
    const client = sb.current;
    if (mode === "signup") {
      const { data, error } = await client.auth.signUp({
        email,
        password: pw,
        options: { data: { display_name: email.split("@")[0] } },
      });
      if (error) {
        setErr(error.message);
        setBusy(false);
        return;
      }
      if (!data.session) {
        setNotice(
          `We sent a confirmation link to ${email}. Confirm it, then sign in to finish your claim.`,
        );
        setMode("signin");
      }
    } else {
      const { error } = await client.auth.signInWithPassword({ email, password: pw });
      if (error) {
        setErr(error.message);
        setBusy(false);
        return;
      }
    }
    setBusy(false);
  }

  async function submitClaim() {
    if (!selected) return;
    setBusy(true);
    setErr(null);
    const res = await fetch("/api/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hotel_id: selected.id }),
    });
    const j = await res.json();
    setBusy(false);
    if (!res.ok) {
      setErr(j.message || j.error || "Something went wrong.");
      return;
    }
    setResult({ maskedEmail: j.maskedEmail ?? "—", devLink: j.devLink });
  }

  /* ---- Success ---- */
  if (result) {
    return (
      <div className="rounded-xl border border-line bg-paper-raised p-7">
        <p className="font-display text-xl font-semibold text-accent">
          Verification sent
        </p>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          We sent a verification link to <strong>{result.maskedEmail}</strong> — the email
          on file for {selected?.name}. Click it from that inbox to finish claiming the
          property.
        </p>
        {result.devLink && (
          <p className="mt-4 rounded-lg bg-accent-soft p-3 text-xs text-ink-soft">
            <span className="font-medium text-accent">Dev mode:</span> email sending is
            disabled, so use this link directly →{" "}
            <a href={result.devLink} className="break-all text-accent underline">
              {result.devLink}
            </a>
          </p>
        )}
      </div>
    );
  }

  /* ---- Step 1: pick a hotel ---- */
  if (!selected) {
    return (
      <div className="relative">
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Find your property by name…"
          aria-label="Search for your hotel"
          className={inputCls}
        />
        {q.trim().length >= 2 && hits.length > 0 && (
          <div className="absolute z-10 mt-2 w-full overflow-hidden rounded-lg border border-line bg-paper-raised shadow-lg">
            {hits.map((h) => (
              <button
                key={h.id}
                onClick={() => {
                  setSelected(h);
                  setQ("");
                  setHits([]);
                }}
                className="flex w-full items-center justify-between gap-4 border-b border-line px-4 py-3 text-left last:border-b-0 hover:bg-paper"
              >
                <span>
                  <span className="font-medium">{h.name}</span>
                  <span className="ml-2 text-sm text-ink-soft">{h.location}</span>
                </span>
                <span className="shrink-0 text-[11px] font-medium uppercase tracking-eyebrow text-accent">
                  {h.brand}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  /* ---- Selected hotel banner ---- */
  const banner = (
    <div className="mb-5 flex items-center justify-between rounded-lg border border-line bg-paper-raised px-4 py-3">
      <div>
        <p className="font-medium">{selected.name}</p>
        <p className="text-sm text-ink-soft">{selected.location}</p>
      </div>
      <button
        onClick={() => setSelected(null)}
        className="text-sm text-ink-soft underline underline-offset-2 hover:text-ink"
      >
        Change
      </button>
    </div>
  );

  /* ---- Step 2: authenticate ---- */
  if (!loading && !user) {
    return (
      <div>
        {banner}
        <form onSubmit={doAuth} className="rounded-xl border border-line bg-paper-raised p-6">
          <p className="font-display text-lg font-semibold">
            {mode === "signup" ? "Create your account" : "Sign in"}
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            You&rsquo;ll manage the property from here once verified.
          </p>
          <div className="mt-4 space-y-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@hotel.com"
              className={inputCls}
            />
            <input
              type="password"
              required
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="Password"
              className={inputCls}
            />
          </div>
          {notice && <p className="mt-3 text-sm text-accent">{notice}</p>}
          {err && <p className="mt-3 text-sm text-disputed">{err}</p>}
          <button
            type="submit"
            disabled={busy}
            className="mt-4 w-full rounded-full bg-ink px-5 py-3 text-sm font-medium text-paper transition-colors hover:bg-accent disabled:opacity-60"
          >
            {busy ? "…" : mode === "signup" ? "Create account" : "Sign in"}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode(mode === "signup" ? "signin" : "signup");
              setErr(null);
            }}
            className="mt-3 w-full text-center text-sm text-ink-soft hover:text-ink"
          >
            {mode === "signup"
              ? "Already have an account? Sign in"
              : "Need an account? Sign up"}
          </button>
        </form>
      </div>
    );
  }

  /* ---- Step 3: confirm claim ---- */
  return (
    <div>
      {banner}
      <div className="rounded-xl border border-line bg-paper-raised p-6">
        <p className="text-sm leading-relaxed text-ink-soft">
          We&rsquo;ll send a one-time verification link to the email we have on file for{" "}
          <strong className="text-ink">{selected.name}</strong>. Click it from that inbox
          to confirm you manage the property.
        </p>
        {err && <p className="mt-3 text-sm text-disputed">{err}</p>}
        <button
          onClick={submitClaim}
          disabled={busy}
          className="mt-4 rounded-full bg-ink px-5 py-3 text-sm font-medium text-paper transition-colors hover:bg-accent disabled:opacity-60"
        >
          {busy ? "Sending…" : "Send verification link"}
        </button>
      </div>
    </div>
  );
}
