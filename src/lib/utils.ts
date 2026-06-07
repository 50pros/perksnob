import { PROFANITY_PATTERNS } from "@/lib/constants";

/** Strip HTML, links, and risky tokens from free text. */
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
