import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

const CONTACT_TO = "hello@50pros.com"; // internal — never shown to the submitter

/**
 * Public contact form. Always stores the message (service role); also sends a
 * best-effort email notification to the internal inbox via Brevo's
 * transactional API when BREVO_API_KEY is configured. The submitter never sees
 * the destination address.
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

  // Best-effort email notification via Brevo transactional API (set BREVO_API_KEY
  // to your Brevo account key). Sends from the authenticated perksnob.com domain;
  // reply-to is the submitter so you can answer them directly from your inbox.
  if (process.env.BREVO_API_KEY) {
    try {
      await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "content-type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({
          sender: {
            email: process.env.CONTACT_FROM_EMAIL || "noreply@perksnob.com",
            name: "PerkSnob Contact",
          },
          to: [{ email: CONTACT_TO }],
          ...(email ? { replyTo: { email, name: name || email } } : {}),
          subject: `New PerkSnob contact${name ? ` from ${name}` : ""}`,
          textContent: `Name: ${name || "—"}\nEmail: ${email || "—"}\n\n${message}`,
        }),
      });
    } catch {
      // The message is already stored; ignore email failures.
    }
  }

  return NextResponse.json({ ok: true });
}
