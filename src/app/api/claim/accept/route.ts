import { NextRequest, NextResponse } from "next/server";
import {
  createServerSupabase,
  createServiceRoleClient,
} from "@/lib/supabase/server";

/**
 * Accept a hotel invitation. The signed-in user accepts an invite token (from
 * the outreach email); possession of the token authorizes the claim, so we
 * mark it verified immediately. Service role bypasses the pending-only RLS.
 */
export async function POST(req: NextRequest) {
  const supa = await createServerSupabase();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  let body: { token?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const token = body.token;
  if (!token) {
    return NextResponse.json({ error: "token_required" }, { status: 400 });
  }

  let svc;
  try {
    svc = await createServiceRoleClient();
  } catch {
    return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
  }

  const { data: invite } = await svc
    .from("hotel_invites")
    .select("token, hotel_id, expires_at, accepted_at, accepted_by")
    .eq("token", token)
    .maybeSingle();

  if (!invite) {
    return NextResponse.json({ error: "invalid_invite" }, { status: 404 });
  }
  if (invite.expires_at && new Date(invite.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: "expired" }, { status: 410 });
  }
  if (
    invite.accepted_at &&
    invite.accepted_by &&
    invite.accepted_by !== user.id
  ) {
    return NextResponse.json({ error: "already_claimed" }, { status: 409 });
  }

  const { data: hotel } = await svc
    .from("hotels")
    .select("slug")
    .eq("id", invite.hotel_id)
    .maybeSingle();

  const { error: claimErr } = await svc.from("hotel_claims").upsert(
    {
      hotel_id: invite.hotel_id,
      user_id: user.id,
      status: "verified",
      verification_method: "email_link",
      verified_at: new Date().toISOString(),
    },
    { onConflict: "hotel_id,user_id" },
  );
  if (claimErr) {
    return NextResponse.json(
      { error: "claim_failed", detail: claimErr.message },
      { status: 500 },
    );
  }

  await svc
    .from("hotel_invites")
    .update({ accepted_at: new Date().toISOString(), accepted_by: user.id })
    .eq("token", token);

  return NextResponse.json({ ok: true, slug: hotel?.slug ?? null });
}
