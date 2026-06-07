"use client";

import { useState } from "react";
import { TIERS } from "@/lib/constants";
import { useAuth } from "@/hooks/useAuth";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onAuth: () => void;
}

type AuthMode = "signin" | "signup" | "reset" | "done";

export default function AuthModal({ open, onClose, onAuth }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [userTier, setUserTier] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const { signIn, signUp, resetPassword } = useAuth();

  const passwordStrength = (pw: string): { label: string; color: string; width: string } => {
    if (pw.length < 6) return { label: "Too short", color: "bg-red-500", width: "w-1/5" };
    if (pw.length < 8) return { label: "Weak", color: "bg-red-400", width: "w-2/5" };
    const hasUpper = /[A-Z]/.test(pw);
    const hasLower = /[a-z]/.test(pw);
    const hasNumber = /\d/.test(pw);
    const hasSymbol = /[^A-Za-z0-9]/.test(pw);
    const score = [hasUpper, hasLower, hasNumber, hasSymbol, pw.length >= 12].filter(Boolean).length;
    if (score >= 4) return { label: "Strong", color: "bg-green-500", width: "w-full" };
    if (score >= 3) return { label: "Good", color: "bg-amber-500", width: "w-3/5" };
    return { label: "Fair", color: "bg-amber-400", width: "w-2/5" };
  };

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setError("");
    setMessage("");
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      if (mode === "signup") {
        if (!userTier) {
          setError("Please select your Marriott Bonvoy elite status");
          setLoading(false);
          return;
        }

        const result = await signUp(email, password, displayName, userTier);
        if (result.error) {
          setError(result.error);
        } else {
          setMessage("Check your email to confirm your account!");
          setMode("done");
        }
      } else if (mode === "signin") {
        const result = await signIn(email, password);
        if (result.error) {
          setError(result.error);
        } else {
          onAuth();
          onClose();
        }
      } else if (mode === "reset") {
        const result = await resetPassword(email);
        if (result.error) {
          setError(result.error);
        } else {
          setMessage(
            result.message ||
              "If an account exists with this email, you'll receive a reset link.",
          );
        }
      }
    } catch (e: any) {
      setError(e.message || "An error occurred");
    }

    setLoading(false);
  };

  const pwStrength = passwordStrength(password);

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="mb-1 font-serif text-2xl font-bold text-slate-900">
        {mode === "signup"
          ? "Create Account"
          : mode === "reset"
            ? "Reset Password"
            : mode === "done"
              ? "Check Your Email"
              : "Welcome back"}
      </h2>
      <p className="mb-7 text-[13px] text-slate-400">
        {mode === "signup"
          ? "Join the community"
          : mode === "reset"
            ? "Enter your email to reset"
            : mode === "done"
              ? ""
              : "Sign in to contribute"}
      </p>

      {error && (
        <div
          role="alert"
          className="mb-3.5 rounded-md bg-red-50 px-3.5 py-2.5 text-xs text-red-600"
        >
          {error}
        </div>
      )}

      {message && (
        <div
          role="status"
          className="mb-3.5 rounded-md bg-green-50 px-3.5 py-2.5 text-xs text-green-600"
        >
          {message}
        </div>
      )}

      {mode === "done" ? (
        <>
          <div className="mb-5 rounded-lg bg-green-50 p-5 text-center">
            <div className="mb-2 text-3xl">&#x2709;&#xFE0F;</div>
            <p className="text-sm font-semibold text-green-600">
              We sent a confirmation link to your email.
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Click the link to activate your account, then come back and sign
              in.
            </p>
          </div>
          <Button onClick={onClose} className="w-full py-3 text-sm">
            Got it
          </Button>
        </>
      ) : (
        <>
          {/* Display name (signup only) */}
          {mode === "signup" && (
            <div className="mb-3.5">
              <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Display Name
              </label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value.slice(0, 30))}
                placeholder="e.g. JetsetterJohn"
                maxLength={30}
                autoFocus
                className="w-full rounded-md border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              />
            </div>
          )}

          {/* Tier select (signup only) */}
          {mode === "signup" && (
            <div className="mb-3.5">
              <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Marriott Bonvoy Status
              </label>
              <select
                value={userTier}
                onChange={(e) => setUserTier(e.target.value)}
                className="w-full rounded-md border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition-all focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              >
                <option value="">Select your elite status...</option>
                {TIERS.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.label}
                  </option>
                ))}
                <option value="none">I&apos;m not elite level</option>
              </select>
            </div>
          )}

          {/* Email */}
          <div className="mb-3.5">
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              autoFocus={mode !== "signup"}
              className="w-full rounded-md border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
            />
          </div>

          {/* Password */}
          {mode !== "reset" && (
            <div className="mb-7">
              <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;"
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                className="w-full rounded-md border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              />
              {/* Password strength indicator (signup only) */}
              {mode === "signup" && password.length > 0 && (
                <div className="mt-2">
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className={`h-full rounded-full transition-all ${pwStrength.color} ${pwStrength.width}`}
                    />
                  </div>
                  <span className="mt-1 block text-[10px] text-slate-400">
                    {pwStrength.label}
                  </span>
                </div>
              )}
            </div>
          )}

          {mode === "reset" && <div className="mb-7" />}

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            loading={loading}
            className="w-full py-3 text-sm"
          >
            {mode === "signup"
              ? "Create Account"
              : mode === "reset"
                ? "Send Reset Link"
                : "Sign In"}
          </Button>

          {/* Mode switching */}
          <div className="mt-4 flex flex-col items-center gap-2">
            {mode === "signin" && (
              <button
                onClick={() => switchMode("reset")}
                className="border-none bg-transparent text-xs text-slate-400 transition-colors hover:text-slate-600"
              >
                Forgot password?
              </button>
            )}
            <button
              onClick={() =>
                switchMode(
                  mode === "signup"
                    ? "signin"
                    : mode === "reset"
                      ? "signin"
                      : "signup",
                )
              }
              className="border-none bg-transparent text-[13px] font-semibold text-slate-900 underline underline-offset-4 transition-colors hover:text-slate-600"
            >
              {mode === "signup"
                ? "Already have an account?"
                : mode === "reset"
                  ? "Back to sign in"
                  : "New? Join and create account"}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
