import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type AlertRequest = {
  requestId?: string;
  force?: boolean;
};

type HotelRequestRow = {
  id: string;
  user_id: string;
  hotel_name: string;
  brand: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  marriott_code: string | null;
  marriott_url: string | null;
  notes: string | null;
  created_at: string;
  notification_sent_at?: string | null;
};

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json", ...corsHeaders },
  });

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

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

function buildEmailHtml(args: { appBaseUrl: string; row: HotelRequestRow }) {
  const { appBaseUrl, row } = args;
  const queueUrl = `${appBaseUrl}/admin/requests`;
  const requestUrl = `${queueUrl}?request=${row.id}`;
  const location = [row.city, row.state, row.country].filter(Boolean).join(", ");

  return `
  <div style="font-family:Arial,sans-serif;background:#f8fafc;padding:20px;">
    <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;padding:24px;">
      <h2 style="margin:0 0 8px 0;color:#0f172a;">New Hotel Request Submitted</h2>
      <p style="margin:0 0 14px 0;color:#475569;">A user submitted a missing-hotel request. Review it in the admin queue.</p>
      <div style="margin:0 0 14px 0;padding:12px;border:1px solid #e2e8f0;border-radius:8px;background:#f8fafc;">
        <p style="margin:0 0 6px 0;color:#0f172a;"><strong>Hotel:</strong> ${escapeHtml(row.hotel_name)}</p>
        ${
          row.brand
            ? `<p style="margin:0 0 6px 0;color:#334155;"><strong>Brand:</strong> ${escapeHtml(row.brand)}</p>`
            : ""
        }
        ${
          location
            ? `<p style="margin:0 0 6px 0;color:#334155;"><strong>Location:</strong> ${escapeHtml(location)}</p>`
            : ""
        }
        ${
          row.marriott_code
            ? `<p style="margin:0 0 6px 0;color:#334155;"><strong>Marriott Code:</strong> ${escapeHtml(
                row.marriott_code
              )}</p>`
            : ""
        }
        ${
          row.marriott_url
            ? `<p style="margin:0 0 6px 0;color:#334155;"><strong>Marriott URL:</strong> <a href="${row.marriott_url}" style="color:#2563eb;">${escapeHtml(
                row.marriott_url
              )}</a></p>`
            : ""
        }
        ${
          row.notes
            ? `<p style="margin:0;color:#334155;"><strong>Notes:</strong> ${escapeHtml(row.notes)}</p>`
            : ""
        }
      </div>
      <a href="${requestUrl}" style="display:inline-block;background:#0f172a;color:#fff;padding:10px 14px;border-radius:6px;text-decoration:none;font-weight:700;">Review in Admin Queue</a>
      <p style="margin:14px 0 0 0;color:#94a3b8;font-size:12px;">Approve or decline from ${queueUrl}</p>
    </div>
  </div>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Method not allowed. Use POST." });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      return json(500, { error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY." });
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY") || "";
    if (!resendApiKey) return json(500, { error: "Missing RESEND_API_KEY." });

    const appBaseUrl = Deno.env.get("APP_BASE_URL") || "https://perksnob.com";
    const alertTo = Deno.env.get("HOTEL_REQUEST_ALERT_TO") || "rei+1@llazani.com";
    const alertFrom =
      Deno.env.get("HOTEL_REQUEST_ALERT_FROM") ||
      Deno.env.get("DIGEST_FROM_EMAIL") ||
      "PerkSnob <digest@perksnob.com>";

    const body = (await req.json().catch(() => ({}))) as AlertRequest;
    const requestId = (body.requestId || "").trim();
    const force = !!body.force;
    if (!requestId) return json(400, { error: "requestId is required." });

    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization") || "";
    const jwt = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!jwt) return json(401, { error: "Missing auth token." });

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(jwt);
    if (authError || !user) return json(401, { error: "Invalid auth token." });

    const { data: reqRow, error: reqError } = await supabase
      .from("hotel_requests")
      .select(
        "id,user_id,hotel_name,brand,city,state,country,marriott_code,marriott_url,notes,created_at,notification_sent_at"
      )
      .eq("id", requestId)
      .maybeSingle();

    if (reqError) throw reqError;
    if (!reqRow) return json(404, { error: "Hotel request not found." });

    const row = reqRow as HotelRequestRow;
    const { data: adminRow } = await supabase
      .from("app_admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();
    const isAdmin = !!adminRow;

    if (row.user_id !== user.id && !isAdmin) {
      return json(403, { error: "Not allowed to notify for this request." });
    }

    if (row.notification_sent_at && !force) {
      return json(200, {
        ok: true,
        skipped: true,
        reason: "already_notified",
        requestId: row.id,
        sentAt: row.notification_sent_at,
      });
    }

    const location = [row.city, row.state, row.country].filter(Boolean).join(", ");
    const subject = location
      ? `New hotel request: ${row.hotel_name} (${location})`
      : `New hotel request: ${row.hotel_name}`;
    const html = buildEmailHtml({ appBaseUrl, row });
    const text = [
      "New hotel request submitted.",
      `Hotel: ${row.hotel_name}`,
      row.brand ? `Brand: ${row.brand}` : "",
      location ? `Location: ${location}` : "",
      row.marriott_code ? `Marriott code: ${row.marriott_code}` : "",
      row.marriott_url ? `Marriott URL: ${row.marriott_url}` : "",
      row.notes ? `Notes: ${row.notes}` : "",
      `Review queue: ${appBaseUrl}/admin/requests`,
      `Request link: ${appBaseUrl}/admin/requests?request=${row.id}`,
    ]
      .filter(Boolean)
      .join("\n");

    await sendWithResend(resendApiKey, alertFrom, alertTo, subject, html, text);

    await supabase
      .from("hotel_requests")
      .update({
        notification_sent_at: new Date().toISOString(),
        notification_error: null,
      })
      .eq("id", row.id);

    return json(200, { ok: true, sent: true, requestId: row.id, to: alertTo });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return json(500, { error: message });
  }
});

