import { NextRequest, NextResponse } from "next/server";
import {
  createServerSupabase,
  createServiceRoleClient,
} from "@/lib/supabase/server";

function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!domain) return "•••";
  const head = user.slice(0, 1);
  return `${head}${"•".repeat(Math.max(2, user.length - 1))}@${domain}`;
}

/**
 * Initiate a hotel claim. The signed-in user requests to manage a hotel; we
 * create a pending claim + a one-time token and (when enabled) email a
 * verification link to the hotel's ON-FILE official address — proving the
 * claimant controls that inbox.
 *
 * SAFETY: real emails are only sent when CLAIM_EMAILS_ENABLED === "true".
 * Otherwise the link is logged / returned for dev so we never contact real
 * hotels during development.
 */
export async function POST(req: NextRequest) {
  const supa = await createServerSupabase();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  let body: { hotel_id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const hotelId = body.hotel_id;
  if (!hotelId) {
    return NextResponse.json({ error: "hotel_id required" }, { status: 400 });
  }

  let svc;
  try {
    svc = await createServiceRoleClient();
  } catch {
    return NextResponse.json(
      { error: "server_misconfigured" },
      { status: 500 },
    );
  }

  const { data: hotel } = await svc
    .from("hotels")
    .select("id,name,slug")
    .eq("id", hotelId)
    .maybeSingle();
  if (!hotel) {
    return NextResponse.json({ error: "hotel_not_found" }, { status: 404 });
  }

  const { data: contact } = await svc
    .from("hotel_contacts")
    .select("email")
    .eq("hotel_id", hotelId)
    .maybeSingle();
  if (!contact?.email) {
    return NextResponse.json(
      {
        error: "no_contact_email",
        message:
          "We don't have an email on file for this property. Contact us and we'll verify you another way.",
      },
      { status: 400 },
    );
  }

  const { data: claim, error: claimErr } = await svc
    .from("hotel_claims")
    .upsert(
      { hotel_id: hotelId, user_id: user.id, status: "pending" },
      { onConflict: "hotel_id,user_id", ignoreDuplicates: false },
    )
    .select("id,status")
    .maybeSingle();
  if (claimErr) {
    return NextResponse.json(
      { error: "claim_failed", detail: claimErr.message },
      { status: 500 },
    );
  }
  if (claim?.status === "verified") {
    return NextResponse.json({ ok: true, alreadyVerified: true });
  }

  const { data: tok, error: tokErr } = await svc
    .from("hotel_claim_tokens")
    .insert({ hotel_id: hotelId, user_id: user.id, email: contact.email })
    .select("token")
    .single();
  if (tokErr || !tok) {
    return NextResponse.json(
      { error: "token_failed", detail: tokErr?.message },
      { status: 500 },
    );
  }

  const base = process.env.APP_BASE_URL || req.nextUrl.origin;
  const link = `${base}/claim/verify?token=${tok.token}`;
  const masked = maskEmail(contact.email);

  const enabled =
    process.env.CLAIM_EMAILS_ENABLED === "true" && !!process.env.RESEND_API_KEY;

  if (!enabled) {
    console.log(
      `[claim] (sending disabled) verify link for "${hotel.name}" → ${contact.email}: ${link}`,
    );
    return NextResponse.json({
      ok: true,
      sent: false,
      maskedEmail: masked,
      devLink: process.env.NODE_ENV !== "production" ? link : undefined,
    });
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.CLAIM_FROM_EMAIL || "PerkSnob <verify@perksnob.com>",
        to: contact.email,
        subject: `Verify your management of ${hotel.name} on PerkSnob`,
        html: `<p>Someone requested to manage <strong>${hotel.name}</strong> on PerkSnob.</p><p>If this was you, confirm by clicking the link below:</p><p><a href="${link}">Verify and claim ${hotel.name}</a></p><p>This link expires in 7 days. If you didn't request this, you can ignore this email.</p>`,
      }),
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: "email_failed", detail: (await res.text()).slice(0, 200) },
        { status: 502 },
      );
    }
  } catch (e) {
    return NextResponse.json(
      { error: "email_failed", detail: e instanceof Error ? e.message : "unknown" },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, sent: true, maskedEmail: masked });
}
