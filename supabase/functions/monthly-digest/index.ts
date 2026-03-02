import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type DigestStatus = "sent" | "skipped" | "failed";

type PrefRow = {
  user_id: string;
  monthly_digest_enabled: boolean;
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

type UpvoteRow = {
  perk_report_id: string;
};

type DigestItem = {
  hotel_id: string;
  category: string;
  description: string;
  elite_tier: string | null;
  report_count: number;
  upvote_count: number;
  total_confirmations: number;
  latest_stay_date: string | null;
  latest_reported_at: string;
};

type DigestRequest = {
  dryRun?: boolean;
  forceDay?: number;
  forceRun?: boolean;
  forceResend?: boolean;
  userIds?: string[];
  topCount?: number;
  windowDays?: number;
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

function toTimestamp(value?: string | null) {
  if (!value) return 0;
  const t = Date.parse(value);
  return Number.isNaN(t) ? 0 : t;
}

function isLastDayOfMonthUtc(date: Date) {
  const tomorrow = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1)
  );
  return tomorrow.getUTCDate() === 1;
}

function formatCategory(category: string) {
  return category
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatTier(tier: string | null) {
  if (!tier) return "All Tiers";
  const map: Record<string, string> = {
    ambassador: "Ambassador",
    titanium: "Titanium",
    platinum: "Platinum",
    gold: "Gold",
    silver: "Silver",
  };
  return map[tier] || tier;
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

async function listRecentPerkReports(
  supabase: ReturnType<typeof createClient>,
  sinceIso: string
) {
  const allRows: PerkRow[] = [];
  const pageSize = 1000;
  let from = 0;

  while (true) {
    const { data, error } = (await supabase
      .from("perk_reports")
      .select("id,user_id,hotel_id,category,description,created_at,display_name,elite_tier,stay_date")
      .gte("created_at", sinceIso)
      .order("stay_date", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .range(from, from + pageSize - 1)) as { data: PerkRow[] | null; error: Error | null };

    if (error) throw error;
    const batch = data || [];
    allRows.push(...batch);

    if (batch.length < pageSize) break;
    from += pageSize;
  }

  return allRows;
}

async function listUpvoteCounts(
  supabase: ReturnType<typeof createClient>,
  reportIds: string[]
) {
  const counts = new Map<string, number>();
  if (!reportIds.length) return counts;

  const chunkSize = 500;
  for (let i = 0; i < reportIds.length; i += chunkSize) {
    const chunk = reportIds.slice(i, i + chunkSize);
    const { data, error } = (await supabase
      .from("upvotes")
      .select("perk_report_id")
      .in("perk_report_id", chunk)) as { data: UpvoteRow[] | null; error: Error | null };

    if (error) throw error;

    for (const row of data || []) {
      counts.set(row.perk_report_id, (counts.get(row.perk_report_id) || 0) + 1);
    }
  }

  return counts;
}

function rankTopPerkItems(
  reports: PerkRow[],
  upvoteCounts: Map<string, number>,
  maxItems: number
) {
  const grouped = new Map<string, DigestItem>();

  for (const row of reports) {
    const description = (row.description || "").trim();
    if (!description) continue;

    const key = `${row.hotel_id}|${row.category}|${row.elite_tier || ""}|${description.toLowerCase()}`;
    const rowUpvotes = upvoteCounts.get(row.id) || 0;
    const existing = grouped.get(key);

    if (!existing) {
      grouped.set(key, {
        hotel_id: row.hotel_id,
        category: row.category,
        description,
        elite_tier: row.elite_tier || null,
        report_count: 1,
        upvote_count: rowUpvotes,
        total_confirmations: 1 + rowUpvotes,
        latest_stay_date: row.stay_date || null,
        latest_reported_at: row.created_at,
      });
      continue;
    }

    existing.report_count += 1;
    existing.upvote_count += rowUpvotes;
    existing.total_confirmations = existing.report_count + existing.upvote_count;

    if (toTimestamp(row.stay_date) > toTimestamp(existing.latest_stay_date)) {
      existing.latest_stay_date = row.stay_date || existing.latest_stay_date;
    }
    if (toTimestamp(row.created_at) > toTimestamp(existing.latest_reported_at)) {
      existing.latest_reported_at = row.created_at;
    }
  }

  const ranked = [...grouped.values()].sort(
    (a, b) =>
      b.total_confirmations - a.total_confirmations ||
      b.upvote_count - a.upvote_count ||
      toTimestamp(b.latest_stay_date) - toTimestamp(a.latest_stay_date) ||
      toTimestamp(b.latest_reported_at) - toTimestamp(a.latest_reported_at) ||
      b.report_count - a.report_count
  );

  // Keep the list varied so one hotel cannot dominate the whole digest.
  const selected: DigestItem[] = [];
  const perHotelCap = 2;
  const perHotelCount = new Map<string, number>();

  for (const item of ranked) {
    const count = perHotelCount.get(item.hotel_id) || 0;
    if (count >= perHotelCap) continue;
    selected.push(item);
    perHotelCount.set(item.hotel_id, count + 1);
    if (selected.length >= maxItems) break;
  }

  if (selected.length < maxItems) {
    for (const item of ranked) {
      if (selected.includes(item)) continue;
      selected.push(item);
      if (selected.length >= maxItems) break;
    }
  }

  return selected;
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
  items: DigestItem[];
  windowDays: number;
}) {
  const { appBaseUrl, hotelMap, items, windowDays } = args;

  const rows = items
    .map((row, index) => {
      const hotel = hotelMap.get(row.hotel_id);
      const hotelName = hotel?.name ?? "Hotel";
      const hotelUrl = hotel?.slug ? `${appBaseUrl}/hotel/${hotel.slug}` : appBaseUrl;
      const timing = row.latest_stay_date
        ? `Latest stay ${formatDate(row.latest_stay_date)} • Reported ${formatDate(row.latest_reported_at)}`
        : `Reported ${formatDate(row.latest_reported_at)}`;
      const score = `${row.total_confirmations} signal${row.total_confirmations === 1 ? "" : "s"} (${row.report_count} report${row.report_count === 1 ? "" : "s"} + ${row.upvote_count} agree${row.upvote_count === 1 ? "" : "s"})`;

      return `<li style="margin:0 0 14px 0;">
        <div style="font-size:12px;color:#64748b;margin-bottom:4px;">#${index + 1} • ${escapeHtml(
          formatCategory(row.category)
        )} • ${escapeHtml(formatTier(row.elite_tier))}</div>
        <a href="${hotelUrl}" style="color:#0f172a;text-decoration:none;font-weight:700;">${escapeHtml(
          hotelName
        )}</a>
        <div style="margin:3px 0 4px 0;color:#334155;font-size:13px;line-height:1.45;">${escapeHtml(
          row.description.slice(0, 180)
        )}</div>
        <div style="color:#64748b;font-size:12px;">${escapeHtml(score)} • ${escapeHtml(timing)}</div>
      </li>`;
    })
    .join("");

  return `
  <div style="font-family:Arial,sans-serif;background:#f8fafc;padding:20px;">
    <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;padding:24px;">
      <h2 style="margin:0 0 8px 0;color:#0f172a;">PerkSnob Monthly Digest</h2>
      <p style="margin:0 0 14px 0;color:#475569;">Top community-reported perks from the last ${windowDays} days.</p>
      <ul style="padding-left:20px;margin:0 0 16px 0;">${
        rows || "<li style='color:#64748b;'>No standout perks were reported in this period.</li>"
      }</ul>
      <a href="${appBaseUrl}" style="display:inline-block;background:#0f172a;color:#fff;padding:10px 14px;border-radius:6px;text-decoration:none;font-weight:700;">Open PerkSnob</a>
      <p style="margin:14px 0 0 0;color:#94a3b8;font-size:12px;">Manage digest settings from your PerkSnob profile page.</p>
    </div>
  </div>`;
}

function buildDigestText(args: {
  appBaseUrl: string;
  hotelMap: Map<string, HotelRow>;
  items: DigestItem[];
  windowDays: number;
}) {
  const { appBaseUrl, hotelMap, items, windowDays } = args;
  const lines = [
    `PerkSnob Monthly Digest`,
    `Top community-reported perks from the last ${windowDays} days:`,
    "",
  ];

  if (!items.length) {
    lines.push("No standout perks were reported in this period.");
  } else {
    items.forEach((row, index) => {
      const hotel = hotelMap.get(row.hotel_id);
      const hotelName = hotel?.name ?? "Hotel";
      const hotelUrl = hotel?.slug ? `${appBaseUrl}/hotel/${hotel.slug}` : appBaseUrl;
      const score = `${row.total_confirmations} signals (${row.report_count} reports + ${row.upvote_count} agrees)`;
      const timing = row.latest_stay_date
        ? `latest stay ${formatDate(row.latest_stay_date)}, reported ${formatDate(row.latest_reported_at)}`
        : `reported ${formatDate(row.latest_reported_at)}`;

      lines.push(
        `${index + 1}. ${hotelName} — ${formatCategory(row.category)} (${formatTier(
          row.elite_tier
        )})`,
        `${row.description}`,
        `${score}; ${timing}`,
        `${hotelUrl}`,
        ""
      );
    });
  }

  lines.push(`Open PerkSnob: ${appBaseUrl}`);
  return lines.join("\n");
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
    const forceRun = !!body.forceRun;
    const forcedUserIds = new Set((body.userIds || []).filter(Boolean));
    const topCount = Math.min(20, Math.max(10, body.topCount || 15));
    const windowDays = Math.min(90, Math.max(7, body.windowDays || 30));

    const appBaseUrl = Deno.env.get("APP_BASE_URL") || "https://perksnob.com";
    const resendApiKey = Deno.env.get("RESEND_API_KEY") || "";
    const digestFrom = Deno.env.get("DIGEST_FROM_EMAIL") || "PerkSnob <digest@perksnob.com>";

    const now = new Date();
    const simulatedNow =
      forceDay !== null
        ? new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), forceDay))
        : now;
    const isLastDay = isLastDayOfMonthUtc(simulatedNow);
    if (!isLastDay && !forceRun && forcedUserIds.size === 0) {
      return json(200, {
        message: "Digest skipped (not last day of month).",
        todayUtc: now.toISOString().slice(0, 10),
      });
    }

    const periodMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
      .toISOString()
      .slice(0, 10);
    const since = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000).toISOString();

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    let prefQuery = supabase
      .from("user_notification_prefs")
      .select("user_id,monthly_digest_enabled")
      .eq("monthly_digest_enabled", true);

    if (forcedUserIds.size > 0) {
      prefQuery = prefQuery.in("user_id", [...forcedUserIds]);
    }

    const { data: prefs, error: prefsError } = (await prefQuery) as {
      data: PrefRow[] | null;
      error: Error | null;
    };
    if (prefsError) throw prefsError;

    if (!prefs?.length) {
      return json(200, {
        message: "No users have monthly digest enabled.",
        periodMonth,
      });
    }

    const targetUserIds = new Set(prefs.map((p) => p.user_id));
    const emailByUserId = await listAuthUsers(supabase, targetUserIds);

    const recentReports = await listRecentPerkReports(supabase, since);
    const upvoteCounts = await listUpvoteCounts(
      supabase,
      recentReports.map((r) => r.id)
    );
    const topItems = rankTopPerkItems(recentReports, upvoteCounts, topCount);

    const hotelIds = [...new Set(topItems.map((i) => i.hotel_id))];
    let hotelMap = new Map<string, HotelRow>();
    if (hotelIds.length) {
      const { data: hotels, error: hotelError } = (await supabase
        .from("hotels")
        .select("id,name,slug,brand,location")
        .in("id", hotelIds)) as { data: HotelRow[] | null; error: Error | null };
      if (hotelError) throw hotelError;
      hotelMap = new Map<string, HotelRow>((hotels || []).map((h) => [h.id, h]));
    }

    const html = buildDigestEmailHtml({
      appBaseUrl,
      hotelMap,
      items: topItems,
      windowDays,
    });
    const text = buildDigestText({
      appBaseUrl,
      hotelMap,
      items: topItems,
      windowDays,
    });
    const subject = topItems.length
      ? `PerkSnob monthly digest: top ${topItems.length} perks from last ${windowDays} days`
      : `PerkSnob monthly digest: no standout perks in last ${windowDays} days`;

    const summary = {
      periodMonth,
      dryRun,
      topCount,
      windowDays,
      candidates: prefs.length,
      rankedCandidateReports: recentReports.length,
      digestItems: topItems.length,
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

      if (dryRun || !resendApiKey) {
        await logDigest(supabase, userId, email, periodMonth, "skipped", {
          reason: dryRun ? "dry_run" : "missing_resend_api_key",
          top_items: topItems.length,
          ranked_candidate_reports: recentReports.length,
          window_days: windowDays,
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
          top_items: topItems.length,
          ranked_candidate_reports: recentReports.length,
          window_days: windowDays,
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
