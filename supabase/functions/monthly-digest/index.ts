import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type DigestStatus = "sent" | "skipped" | "failed";

type PrefRow = {
  user_id: string;
  monthly_digest_enabled: boolean;
  digest_send_day: number;
};

type FollowRow = {
  hotel_id: string;
};

type HotelRow = {
  id: string;
  name: string;
  slug: string | null;
  brand: string | null;
  location: string | null;
};

type PerkRow = {
  id: string;
  user_id: string | null;
  hotel_id: string;
  category: string;
  description: string | null;
  created_at: string;
  display_name: string | null;
  elite_tier: string | null;
  stay_date: string | null;
};

type DigestRequest = {
  dryRun?: boolean;
  forceDay?: number;
  forceResend?: boolean;
  userIds?: string[];
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json" },
  });

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

function formatDate(dateIso: string) {
  try {
    return new Date(dateIso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  } catch {
    return dateIso;
  }
}

async function listAuthUsers(
  supabase: ReturnType<typeof createClient>,
  targetUserIds: Set<string>
) {
  const emailByUserId = new Map<string, string>();
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const users = data?.users ?? [];
    for (const u of users) {
      if (targetUserIds.has(u.id) && u.email) emailByUserId.set(u.id, u.email);
    }
    if (users.length < perPage || emailByUserId.size === targetUserIds.size) break;
    page += 1;
  }

  return emailByUserId;
}

async function logDigest(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  email: string,
  periodMonth: string,
  status: DigestStatus,
  details: Record<string, unknown>
) {
  await supabase.from("email_digest_log").upsert(
    {
      user_id: userId,
      email,
      period_month: periodMonth,
      status,
      details,
    },
    { onConflict: "user_id,period_month" }
  );
}

async function sendWithResend(
  resendApiKey: string,
  from: string,
  to: string,
  subject: string,
  html: string,
  text: string
) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      html,
      text,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend error ${response.status}: ${body}`);
  }
}

function buildDigestEmailHtml(args: {
  appBaseUrl: string;
  hotelMap: Map<string, HotelRow>;
  recentPerks: PerkRow[];
  followedCount: number;
}) {
  const { appBaseUrl, hotelMap, recentPerks, followedCount } = args;
  const rows = recentPerks.slice(0, 12);

  const items = rows
    .map((row) => {
      const hotel = hotelMap.get(row.hotel_id);
      const name = hotel?.name ?? "Hotel";
      const slug = hotel?.slug ? `${appBaseUrl}/hotel/${hotel.slug}` : appBaseUrl;
      const line = row.description ? escapeHtml(row.description.slice(0, 140)) : "New report";
      const category = escapeHtml(row.category.replaceAll("_", " "));
      const timing = row.stay_date
        ? `stayed ${formatDate(row.stay_date)}, reported ${formatDate(row.created_at)}`
        : `reported ${formatDate(row.created_at)}`;
      return `<li style="margin:0 0 10px 0;"><a href="${slug}" style="color:#0f172a;text-decoration:none;font-weight:700;">${escapeHtml(
        name
      )}</a> <span style="color:#64748b;">(${category}, ${escapeHtml(
        timing
      )})</span><br/><span style="color:#475569;">${line}</span></li>`;
    })
    .join("");

  return `
  <div style="font-family:Arial,sans-serif;background:#f8fafc;padding:20px;">
    <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;padding:24px;">
      <h2 style="margin:0 0 8px 0;color:#0f172a;">PerkSnob Monthly Digest</h2>
      <p style="margin:0 0 14px 0;color:#475569;">You are following ${followedCount} hotel${followedCount !== 1 ? "s" : ""}. Here are recent updates from the community:</p>
      <ul style="padding-left:20px;margin:0 0 16px 0;">${items || "<li style='color:#64748b;'>No recent reports this month.</li>"}</ul>
      <a href="${appBaseUrl}" style="display:inline-block;background:#0f172a;color:#fff;padding:10px 14px;border-radius:6px;text-decoration:none;font-weight:700;">Open PerkSnob</a>
      <p style="margin:14px 0 0 0;color:#94a3b8;font-size:12px;">Manage digest settings from your PerkSnob profile page.</p>
    </div>
  </div>`;
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return json(405, { error: "Method not allowed. Use POST." });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      return json(500, {
        error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.",
      });
    }

    const digestSecret = Deno.env.get("DIGEST_CRON_SECRET");
    if (digestSecret) {
      const provided = req.headers.get("x-digest-secret");
      if (provided !== digestSecret) {
        return json(401, { error: "Invalid digest secret." });
      }
    }

    const body = (await req.json().catch(() => ({}))) as DigestRequest;
    const dryRun = !!body.dryRun;
    const forceResend = !!body.forceResend;
    const forceDay = body.forceDay ? Math.min(28, Math.max(1, body.forceDay)) : null;
    const forcedUserIds = new Set((body.userIds || []).filter(Boolean));

    const appBaseUrl = Deno.env.get("APP_BASE_URL") || "https://perksnob.com";
    const resendApiKey = Deno.env.get("RESEND_API_KEY") || "";
    const digestFrom = Deno.env.get("DIGEST_FROM_EMAIL") || "PerkSnob <digest@perksnob.com>";

    const now = new Date();
    const day = forceDay ?? now.getUTCDate();
    const periodMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
      .toISOString()
      .slice(0, 10);
    const since = new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000).toISOString();

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    let prefQuery = supabase
      .from("user_notification_prefs")
      .select("user_id,monthly_digest_enabled,digest_send_day")
      .eq("monthly_digest_enabled", true);

    if (forcedUserIds.size > 0) {
      prefQuery = prefQuery.in("user_id", [...forcedUserIds]);
    } else {
      prefQuery = prefQuery.eq("digest_send_day", day);
    }

    const { data: prefs, error: prefsError } = (await prefQuery) as {
      data: PrefRow[] | null;
      error: Error | null;
    };
    if (prefsError) throw prefsError;

    if (!prefs?.length) {
      return json(200, {
        message: "No users due for digest.",
        day,
        periodMonth,
      });
    }

    const targetUserIds = new Set(prefs.map((p) => p.user_id));
    const emailByUserId = await listAuthUsers(supabase, targetUserIds);

    const summary = {
      periodMonth,
      day,
      dryRun,
      candidates: prefs.length,
      sent: 0,
      skipped: 0,
      failed: 0,
      details: [] as Array<{ userId: string; status: DigestStatus; reason?: string }>,
    };

    for (const pref of prefs) {
      const userId = pref.user_id;
      const email = emailByUserId.get(userId);

      if (!email) {
        await logDigest(supabase, userId, "unknown", periodMonth, "skipped", {
          reason: "missing_email",
        });
        summary.skipped += 1;
        summary.details.push({ userId, status: "skipped", reason: "missing_email" });
        continue;
      }

      if (!forceResend) {
        const { data: existing } = await supabase
          .from("email_digest_log")
          .select("id,status")
          .eq("user_id", userId)
          .eq("period_month", periodMonth)
          .maybeSingle();
        if (existing?.status === "sent") {
          summary.skipped += 1;
          summary.details.push({ userId, status: "skipped", reason: "already_sent" });
          continue;
        }
      }

      const { data: follows, error: followsError } = (await supabase
        .from("hotel_follows")
        .select("hotel_id")
        .eq("user_id", userId)) as { data: FollowRow[] | null; error: Error | null };
      if (followsError) {
        await logDigest(supabase, userId, email, periodMonth, "failed", {
          reason: "hotel_follows_query_failed",
          error: followsError.message,
        });
        summary.failed += 1;
        summary.details.push({ userId, status: "failed", reason: "hotel_follows_query_failed" });
        continue;
      }

      const hotelIds = [...new Set((follows || []).map((f) => f.hotel_id))];
      if (!hotelIds.length) {
        await logDigest(supabase, userId, email, periodMonth, "skipped", {
          reason: "no_follows",
        });
        summary.skipped += 1;
        summary.details.push({ userId, status: "skipped", reason: "no_follows" });
        continue;
      }

      const { data: hotels } = (await supabase
        .from("hotels")
        .select("id,name,slug,brand,location")
        .in("id", hotelIds)) as { data: HotelRow[] | null };
      const hotelMap = new Map<string, HotelRow>((hotels || []).map((h) => [h.id, h]));

      const { data: recentPerks, error: perksError } = (await supabase
        .from("perk_reports")
        .select("id,user_id,hotel_id,category,description,created_at,display_name,elite_tier,stay_date")
        .in("hotel_id", hotelIds)
        .gte("created_at", since)
        .neq("user_id", userId)
        .order("stay_date", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(150)) as { data: PerkRow[] | null; error: Error | null };
      if (perksError) {
        await logDigest(supabase, userId, email, periodMonth, "failed", {
          reason: "perk_query_failed",
          error: perksError.message,
        });
        summary.failed += 1;
        summary.details.push({ userId, status: "failed", reason: "perk_query_failed" });
        continue;
      }

      const html = buildDigestEmailHtml({
        appBaseUrl,
        hotelMap,
        recentPerks: recentPerks || [],
        followedCount: hotelIds.length,
      });

      const subject = recentPerks?.length
        ? `PerkSnob monthly digest: ${recentPerks.length} new updates`
        : "PerkSnob monthly digest: no new updates yet";
      const text = recentPerks?.length
        ? `You have ${recentPerks.length} recent updates at followed hotels. Open ${appBaseUrl} to review and contribute.`
        : `No new updates this month. Open ${appBaseUrl} to check your followed hotels and contribute.`;

      if (dryRun || !resendApiKey) {
        await logDigest(supabase, userId, email, periodMonth, "skipped", {
          reason: dryRun ? "dry_run" : "missing_resend_api_key",
          recent_perks: recentPerks?.length || 0,
          followed_hotels: hotelIds.length,
        });
        summary.skipped += 1;
        summary.details.push({
          userId,
          status: "skipped",
          reason: dryRun ? "dry_run" : "missing_resend_api_key",
        });
        continue;
      }

      try {
        await sendWithResend(resendApiKey, digestFrom, email, subject, html, text);
        await logDigest(supabase, userId, email, periodMonth, "sent", {
          recent_perks: recentPerks?.length || 0,
          followed_hotels: hotelIds.length,
        });
        summary.sent += 1;
        summary.details.push({ userId, status: "sent" });
      } catch (sendError) {
        const message =
          sendError instanceof Error ? sendError.message : String(sendError || "unknown send error");
        await logDigest(supabase, userId, email, periodMonth, "failed", {
          reason: "send_failed",
          error: message,
        });
        summary.failed += 1;
        summary.details.push({ userId, status: "failed", reason: "send_failed" });
      }
    }

    return json(200, summary);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return json(500, { error: message });
  }
});
