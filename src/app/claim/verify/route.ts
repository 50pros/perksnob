import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

/**
 * Consume a claim verification token (clicked from the hotel's on-file email).
 * Token possession proves control of that inbox, so this marks the claim
 * verified via the service role regardless of who is signed in.
 */
export async function GET(req: NextRequest) {
  const base = req.nextUrl.origin;
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.redirect(`${base}/`);

  let svc;
  try {
    svc = await createServiceRoleClient();
  } catch {
    return NextResponse.redirect(`${base}/`);
  }

  const { data: tok } = await svc
    .from("hotel_claim_tokens")
    .select("token, hotel_id, user_id, used_at, expires_at")
    .eq("token", token)
    .maybeSingle();

  if (!tok) return NextResponse.redirect(`${base}/`);
  if (tok.used_at) return NextResponse.redirect(`${base}/dashboard?claim=already`);
  if (new Date(tok.expires_at).getTime() < Date.now()) {
    return NextResponse.redirect(`${base}/`);
  }

  await svc
    .from("hotel_claims")
    .update({
      status: "verified",
      verified_at: new Date().toISOString(),
      verification_method: "email_link",
    })
    .eq("hotel_id", tok.hotel_id)
    .eq("user_id", tok.user_id);

  await svc
    .from("hotel_claim_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("token", token);

  return NextResponse.redirect(`${base}/dashboard?claim=verified`);
}
