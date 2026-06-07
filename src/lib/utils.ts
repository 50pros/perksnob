import { TIERS, CATS, PROFANITY_PATTERNS, IMPLIED_NEGATIVE_BY_CATEGORY } from "@/lib/constants";
import type {
  PerkReport,
  PerkCategory,
  EliteTier,
  ConfidenceLevel,
  PerkOutcome,
  TierDef,
  CategoryDef,
} from "@/lib/types";

export function getCategory(key: PerkCategory): CategoryDef {
  return CATS.find((c) => c.key === key) || CATS[CATS.length - 1];
}

export function getTier(key: EliteTier): TierDef {
  return TIERS.find((t) => t.key === key) || TIERS[TIERS.length - 1];
}

export function confidenceColor(confidence: ConfidenceLevel): string {
  return confidence === "high"
    ? "#1a1a1a"
    : confidence === "medium"
      ? "#6b7280"
      : "#9ca3af";
}

export function confidenceLabel(confidence: ConfidenceLevel): string {
  return confidence === "high"
    ? "Well established"
    : confidence === "medium"
      ? "Frequently reported"
      : "Few reports";
}

export function confidenceValue(n: number): ConfidenceLevel {
  return n >= 8 ? "high" : n >= 4 ? "medium" : "low";
}

export function badgeEmoji(badge: string): string {
  return badge === "Snob Supreme"
    ? "\u{1F451}"
    : badge === "Elite Reporter"
      ? "\u2B50"
      : badge === "Perk Scout"
        ? "\u{1F50D}"
        : badge === "Contributor"
          ? "\u270D\uFE0F"
          : "\u{1F195}";
}

export function timeAgo(date: string): string {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return Math.floor(s / 60) + "m ago";
  if (s < 86400) return Math.floor(s / 3600) + "h ago";
  if (s < 2592000) return Math.floor(s / 86400) + "d ago";
  return Math.floor(s / 2592000) + "mo ago";
}

export function formatStayDate(date: string | null): string | null {
  if (!date) return null;
  return new Date(date + "T00:00:00").toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
  });
}

export function toTimestamp(value: string | null | undefined): number {
  if (!value) return 0;
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? 0 : t;
}

export function sortPerksByStayDate(rows: PerkReport[]): PerkReport[] {
  return [...(rows || [])].sort((a, b) => {
    const as = toTimestamp(
      a.stay_date || (a as Record<string, any>).latest_stay,
    );
    const bs = toTimestamp(
      b.stay_date || (b as Record<string, any>).latest_stay,
    );
    if (bs !== as) return bs - as;
    return toTimestamp(b.created_at) - toTimestamp(a.created_at);
  });
}

export function displayName(user: any): string {
  return (
    user?.user_metadata?.display_name ||
    user?.email?.split("@")[0] ||
    "Anonymous"
  );
}

export function perkScore(reportCount: number, categoryCount: number): number {
  return Math.min(100, reportCount * 3 + categoryCount * 8);
}

export function normalizeReportOutcome(v: unknown): PerkOutcome | null {
  if (v === undefined || v === null) return null;
  const s = String(v).trim().toLowerCase();
  if (
    [
      "received",
      "yes",
      "y",
      "true",
      "provided",
      "granted",
      "available",
      "included",
    ].includes(s)
  )
    return "received";
  if (
    [
      "not_received",
      "not-received",
      "no",
      "n",
      "false",
      "missing",
      "denied",
      "unavailable",
      "not provided",
      "not_provided",
      "not included",
      "not_included",
      "did_not_receive",
      "did-not-receive",
    ].includes(s)
  )
    return "not_received";
  return null;
}

export function perkOutcome(report: PerkReport): PerkOutcome {
  const details =
    report?.category_details && typeof report.category_details === "object"
      ? report.category_details
      : {};
  const explicit = normalizeReportOutcome(
    (details as Record<string, any>).report_outcome ??
      (report as Record<string, any>)?.report_outcome ??
      (details as Record<string, any>).outcome,
  );
  if (explicit) return explicit;
  const implied =
    IMPLIED_NEGATIVE_BY_CATEGORY[
      report?.category as keyof typeof IMPLIED_NEGATIVE_BY_CATEGORY
    ];
  if (implied && implied(details)) return "not_received";
  return "received";
}

export function likelihoodColor(score: number): string {
  return score >= 70 ? "#059669" : score >= 40 ? "#d97706" : "#dc2626";
}

export function likelihoodBg(score: number): string {
  return score >= 70 ? "#ecfdf5" : score >= 40 ? "#fffbeb" : "#fef2f2";
}

export function likelihoodLabel(score: number): string {
  return score >= 85
    ? "Very likely"
    : score >= 65
      ? "Likely"
      : score >= 45
        ? "Mixed"
        : score >= 25
          ? "Unlikely"
          : "Rarely reported";
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function sanitize(input: string | null | undefined): string {
  if (!input) return input as string;
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/javascript:/gi, "")
    .replace(/data:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .replace(/https?:\/\/\S+/gi, "[link removed]")
    .replace(/www\.\S+/gi, "[link removed]")
    .replace(/\.com\/\S*/gi, "[link removed]")
    .replace(/\.exe|\.zip|\.bat|\.cmd|\.msi|\.scr|\.ps1/gi, "[blocked]")
    .trim();
}

export function hasProfanity(input: string | null | undefined): boolean {
  if (!input) return false;
  const w = String(input).toLowerCase();
  return PROFANITY_PATTERNS.some((re: RegExp) => re.test(w));
}

export function haversine(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getAccountAgeDays(user: any): number {
  if (!user?.created_at) return 0;
  return Math.floor(
    (Date.now() - new Date(user.created_at).getTime()) / 86400000,
  );
}

export function isEmailVerified(user: any): boolean {
  return !!user?.email_confirmed_at;
}
