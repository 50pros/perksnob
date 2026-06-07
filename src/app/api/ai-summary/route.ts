import { NextRequest, NextResponse } from "next/server";
import {
  createServiceRoleClient,
  createServerSupabase,
} from "@/lib/supabase/server";

async function getSupabase() {
  try {
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return await createServiceRoleClient();
    }
  } catch {
    // fall through
  }
  return await createServerSupabase();
}

export async function GET(request: NextRequest) {
  const hotelId = request.nextUrl.searchParams.get("hotel_id");

  if (!hotelId) {
    return NextResponse.json(
      { error: "hotel_id is required" },
      { status: 400 },
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ status: "not_configured" });
  }

  try {
    const supabase = await getSupabase();

    const { data: cached } = await supabase
      .from("hotel_ai_summaries")
      .select("summary, perk_count_at_generation")
      .eq("hotel_id", hotelId)
      .single();

    if (cached?.summary) {
      return NextResponse.json({ summary: cached.summary });
    }

    return NextResponse.json({ status: "not_configured" });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch summary" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ status: "not_configured" });
  }

  let body: { hotel_id?: string; force?: boolean; regenerate?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const hotelId = body.hotel_id;
  const force = body.force || body.regenerate || false;

  if (!hotelId) {
    return NextResponse.json(
      { error: "hotel_id is required" },
      { status: 400 },
    );
  }

  try {
    const supabase = await getSupabase();

    // Fetch perk reports for this hotel
    const { data: perkReports, error: perkErr } = await supabase
      .from("perk_reports")
      .select("category, elite_tier, description, category_details, stay_date")
      .eq("hotel_id", hotelId)
      .order("created_at", { ascending: false })
      .limit(200);

    if (perkErr) {
      return NextResponse.json(
        { error: "Failed to fetch perk reports" },
        { status: 500 },
      );
    }

    const perkCount = perkReports?.length ?? 0;

    if (perkCount === 0) {
      return NextResponse.json({
        summary: null,
        status: "no_data",
      });
    }

    // Fetch aggregated perks if available
    const { data: aggregatedPerks } = await supabase
      .from("aggregated_perks")
      .select(
        "category, elite_tier, summary, report_count, confidence, last_reported",
      )
      .eq("hotel_id", hotelId);

    // Check if cached summary exists and is still valid
    if (!force) {
      const { data: cached } = await supabase
        .from("hotel_ai_summaries")
        .select("summary, perk_count_at_generation")
        .eq("hotel_id", hotelId)
        .single();

      if (cached?.summary && cached.perk_count_at_generation === perkCount) {
        return NextResponse.json({ summary: cached.summary });
      }
    }

    // Build structured perk data for the prompt
    const categoryBreakdown: Record<
      string,
      { count: number; tiers: string[]; outcomes: string[] }
    > = {};

    for (const report of perkReports ?? []) {
      const cat = report.category;
      if (!categoryBreakdown[cat]) {
        categoryBreakdown[cat] = { count: 0, tiers: [], outcomes: [] };
      }
      categoryBreakdown[cat].count += 1;
      if (
        report.elite_tier &&
        !categoryBreakdown[cat].tiers.includes(report.elite_tier)
      ) {
        categoryBreakdown[cat].tiers.push(report.elite_tier);
      }
      if (report.description) {
        categoryBreakdown[cat].outcomes.push(
          report.description.slice(0, 100),
        );
      }
    }

    const aggregatedSummaries = (aggregatedPerks ?? []).map((a) => ({
      category: a.category,
      tier: a.elite_tier,
      summary: a.summary,
      reports: a.report_count,
      confidence: a.confidence,
    }));

    const perkDataStr = JSON.stringify(
      {
        total_reports: perkCount,
        categories: categoryBreakdown,
        aggregated: aggregatedSummaries,
      },
      null,
      2,
    );

    // Call Anthropic API
    const { default: Anthropic } = await import("@anthropic-ai/sdk");

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const systemPrompt = [
      "You are a hotel perk analyst for PerkSnob, a Marriott Bonvoy elite benefits tracker.",
      "Generate a concise 'Perks at a Glance' summary based on the structured perk report data provided.",
      "Focus on what elite members can realistically expect at this hotel.",
      "Be specific about breakfast, lounge access, upgrades, and standout perks.",
      "Keep the tone informative and direct -- no marketing fluff.",
      "",
      "Respond with ONLY valid JSON in this format:",
      '{ "text": "2-3 sentence summary", "highlights": ["highlight1", "highlight2", "highlight3"] }',
      "",
      "The highlights should be short tags (2-4 words each) like: 'Strong breakfast', 'Suite upgrades common', 'No lounge'.",
      "Maximum 3-5 highlights. The text should be under 200 characters.",
    ].join("\n");

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 300,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Here is the perk data for this hotel:\n\n${perkDataStr}`,
        },
      ],
    });

    // Parse AI response
    const responseText =
      message.content[0]?.type === "text" ? message.content[0].text : "";

    let parsed: { text: string; highlights: string[] };
    try {
      parsed = JSON.parse(responseText);
    } catch {
      // If JSON parsing fails, use the raw text
      parsed = {
        text: responseText.slice(0, 200),
        highlights: [],
      };
    }

    const summaryObj = {
      text: parsed.text || responseText.slice(0, 200),
      highlights: Array.isArray(parsed.highlights)
        ? parsed.highlights.slice(0, 5)
        : [],
      generated_model: "claude-sonnet-4-20250514",
    };

    // Upsert into hotel_ai_summaries
    await supabase.from("hotel_ai_summaries").upsert(
      {
        hotel_id: hotelId,
        summary: summaryObj,
        perk_count_at_generation: perkCount,
        generated_at: new Date().toISOString(),
      },
      { onConflict: "hotel_id" },
    );

    return NextResponse.json({ summary: summaryObj });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to generate summary";
    console.error("AI summary generation error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
