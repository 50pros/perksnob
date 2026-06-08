import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

const CONTACT_TO = "hello@perksnob.com";

/**
 * Public contact form. Always stores the message (service role); also sends a
 * best-effort email notification to hello@perksnob.com when Resend is configured.
 */
export async function POST(req: NextRequest) {
  let body: {
    name?: string;
    email?: string;
    message?: string;
    website?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  // Honeypot: real users never fill this hidden field. Pretend success.
  if (body.website) return NextResponse.json({ ok: true });

  const name = (body.name ?? "").trim().slice(0, 100);
  const email = (body.email ?? "").trim().slice(0, 200);
  const message = (body.message ?? "").trim().slice(0, 5000);

  if (message.length < 5) {
    return NextResponse.json({ error: "message_too_short" }, { status: 400 });
  }
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }

  let svc;
  try {
    svc = await createServiceRoleClient();
  } catch {
    return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
  }

  const { error } = await svc
    .from("contact_messages")
    .insert({ name: name || null, email: email || null, message });
  if (error) {
    return NextResponse.json({ error: "store_failed" }, { status: 500 });
  }

  // Best-effort email (activates once RESEND_API_KEY + a verified domain exist).
  if (process.env.RESEND_API_KEY) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.CONTACT_FROM_EMAIL || "PerkSnob <contact@perksnob.com>",
          to: CONTACT_TO,
          reply_to: email || undefined,
          subject: `New PerkSnob contact${name ? ` from ${name}` : ""}`,
          text: `Name: ${name || "—"}\nEmail: ${email || "—"}\n\n${message}`,
        }),
      });
    } catch {
      // The message is already stored; ignore email failures.
    }
  }

  return NextResponse.json({ ok: true });
}
