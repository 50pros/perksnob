"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

const inputCls =
  "w-full rounded-lg border border-line bg-paper-raised px-4 py-3 text-base text-ink outline-none transition-colors placeholder:text-ink-soft focus:border-ink";

export default function SignInForm({ next }: { next: string }) {
  const { signIn, signUp } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    setNotice(null);
    const res =
      mode === "signin"
        ? await signIn(email, pw)
        : await signUp(email, pw, name || email.split("@")[0], "silver");
    setBusy(false);
    if (res.error) {
      setErr(res.error);
      return;
    }
    if (mode === "signup") {
      setNotice(
        "Account created. If email confirmation is enabled, confirm it, then sign in.",
      );
      setMode("signin");
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-line bg-paper-raised p-7">
      <h1 className="font-display text-2xl font-semibold tracking-tight">
        {mode === "signin" ? "Sign in" : "Create your account"}
      </h1>
      <p className="mt-1 text-sm text-ink-soft">
        {mode === "signin"
          ? "Welcome back to PerkSnob."
          : "Join to confirm perks and track the hotels you follow."}
      </p>
      <div className="mt-5 space-y-3">
        {mode === "signup" && (
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Display name"
            className={inputCls}
          />
        )}
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
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
        className="mt-5 w-full rounded-full bg-ink px-5 py-3 text-sm font-medium text-paper transition-colors hover:bg-accent disabled:opacity-60"
      >
        {busy ? "…" : mode === "signin" ? "Sign in" : "Create account"}
      </button>
      <button
        type="button"
        onClick={() => {
          setMode(mode === "signin" ? "signup" : "signin");
          setErr(null);
          setNotice(null);
        }}
        className="mt-3 w-full text-center text-sm text-ink-soft hover:text-ink"
      >
        {mode === "signin"
          ? "Need an account? Sign up"
          : "Already have an account? Sign in"}
      </button>
    </form>
  );
}
