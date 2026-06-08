"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const inputCls =
  "w-full rounded-lg border border-line bg-paper px-4 py-3 text-base text-ink outline-none transition-colors placeholder:text-ink-soft focus:border-ink";

export default function InviteAccept({
  token,
  hotelName,
  hotelEmail,
  signedIn,
}: {
  token: string;
  hotelName: string;
  hotelEmail: string;
  signedIn: boolean;
}) {
  const { user, signIn, signUp } = useAuth();
  const router = useRouter();
  const isSignedIn = signedIn || !!user;

  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [email, setEmail] = useState(hotelEmail || "");
  const [name, setName] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function accept(): Promise<boolean> {
    const res = await fetch("/api/claim/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 401) return false; // no session yet (e.g. email confirm pending)
      setErr(
        data.error === "already_claimed"
          ? "This profile has already been claimed by another account."
          : data.error === "expired"
            ? "This invitation has expired. Contact us for a new link."
            : "Something went wrong. Please try again.",
      );
      return true; // handled (terminal) — don't fall through to confirm-email path
    }
    router.push("/dashboard?claimed=1");
    router.refresh();
    return true;
  }

  async function onAcceptClick() {
    setBusy(true);
    setErr(null);
    await accept();
    setBusy(false);
  }

  async function onAuthSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    setNotice(null);

    const res =
      mode === "signin"
        ? await signIn(email, pw)
        : await signUp(email, pw, name || `${hotelName} team`.slice(0, 28), "silver");

    if (res.error) {
      setBusy(false);
      setErr(res.error);
      return;
    }

    // Make sure a session actually exists before hitting the accept API.
    const { data } = await createClient().auth.getSession();
    if (!data.session) {
      // Email confirmation is enabled — they must confirm first.
      setBusy(false);
      setNotice(
        `Almost there — check ${email} to confirm your account, then reopen this invitation link to finish claiming ${hotelName}.`,
      );
      setMode("signin");
      return;
    }

    const handled = await accept();
    if (!handled) {
      setNotice(
        `Almost there — check ${email} to confirm your account, then reopen this link to finish.`,
      );
    }
    setBusy(false);
  }

  if (isSignedIn) {
    return (
      <div className="rounded-xl border border-line bg-paper-raised p-6">
        <p className="font-display text-lg font-semibold">
          Accept your invitation
        </p>
        <p className="mt-1 text-sm text-ink-soft">
          You&rsquo;re signed in. Claim {hotelName} to start declaring your official elite
          perks.
        </p>
        <button
          onClick={onAcceptClick}
          disabled={busy}
          className="mt-4 rounded-full bg-ink px-6 py-3 text-sm font-medium text-paper transition-colors hover:bg-accent disabled:opacity-60"
        >
          {busy ? "Claiming…" : `Accept & claim ${hotelName} →`}
        </button>
        {err && <p className="mt-3 text-sm text-disputed">{err}</p>}
      </div>
    );
  }

  return (
    <form
      onSubmit={onAuthSubmit}
      className="rounded-xl border border-line bg-paper-raised p-6"
    >
      <p className="font-display text-lg font-semibold">
        {mode === "signup" ? "Create your account to claim" : "Sign in to claim"}
      </p>
      <p className="mt-1 text-sm text-ink-soft">
        {mode === "signup"
          ? "Set up a login to manage this property. We've pre-filled your hotel's email."
          : "Welcome back — sign in to finish claiming."}
      </p>
      <div className="mt-4 space-y-3">
        {mode === "signup" && (
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name (e.g. front office manager)"
            className={inputCls}
          />
        )}
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
          placeholder="Password (8+ characters)"
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
        {busy
          ? "Claiming…"
          : mode === "signup"
            ? `Create account & claim ${hotelName} →`
            : `Sign in & claim ${hotelName} →`}
      </button>
      <button
        type="button"
        onClick={() => {
          setMode(mode === "signup" ? "signin" : "signup");
          setErr(null);
          setNotice(null);
        }}
        className="mt-3 w-full text-center text-sm text-ink-soft hover:text-ink"
      >
        {mode === "signup"
          ? "Already have an account? Sign in"
          : "Need an account? Create one"}
      </button>
    </form>
  );
}
