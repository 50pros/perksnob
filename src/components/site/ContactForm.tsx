"use client";

import { useState } from "react";

const inputCls =
  "w-full rounded-lg border border-line bg-paper px-4 py-3 text-base text-ink outline-none transition-colors placeholder:text-ink-soft focus:border-ink";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErr(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message, website }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setErr(
          d.error === "message_too_short"
            ? "Please write a message."
            : d.error === "invalid_email"
              ? "Please enter a valid email."
              : "Something went wrong. Please try again.",
        );
        setStatus("error");
        return;
      }
      setStatus("sent");
      setName("");
      setEmail("");
      setMessage("");
    } catch {
      setErr("Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-xl border border-line bg-paper-raised p-6">
        <p className="font-display text-lg font-semibold text-accent">
          Thanks — your message was sent.
        </p>
        <p className="mt-1 text-sm text-ink-soft">
          We read everything and will get back to you.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-line bg-paper-raised p-6">
      <div className="grid gap-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className={inputCls}
        />
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email"
          className={inputCls}
        />
        <textarea
          required
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="How can we help?"
          className={`${inputCls} resize-y`}
        />
        {/* Honeypot — hidden from humans, bots tend to fill it. */}
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          className="hidden"
          aria-hidden
        />
      </div>
      {err && <p className="mt-3 text-sm text-disputed">{err}</p>}
      <button
        type="submit"
        disabled={status === "sending"}
        className="mt-4 rounded-full bg-ink px-6 py-3 text-sm font-medium text-paper transition-colors hover:bg-accent disabled:opacity-60"
      >
        {status === "sending" ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
