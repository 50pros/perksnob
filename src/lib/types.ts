export type EliteTier =
  | "ambassador"
  | "titanium"
  | "platinum"
  | "gold"
  | "silver";

export type PerkCategory =
  | "breakfast"
  | "lounge"
  | "drinks"
  | "upgrade"
  | "gift"
  | "late_checkout"
  | "spa"
  | "parking"
  | "fnb_credit"
  | "housekeeping"
  | "bathroom"
  | "wifi"
  | "shower"
  | "security"
  | "pool"
  | "staff_service"
  | "restaurant"
  | "other";

export type Brand =
  | "The Ritz-Carlton"
  | "St. Regis"
  | "W Hotels"
  | "EDITION"
  | "The Luxury Collection"
  | "JW Marriott"
  | "Westin"
  | "Sheraton"
  | "Marriott"
  | "Autograph Collection"
  | "Tribute Portfolio"
  | "Design Hotels";

export interface Hotel {
  id: string;
  name: string;
  brand: string;
  location: string;
  slug: string;
  created_at: string;
  latitude: number | null;
  longitude: number | null;
  status: string;
  submitted_by: string | null;
  region: string | null;
  country: string | null;
  country_code: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  room_count: number | null;
  marriott_code: string | null;
  email: string | null;
}

export interface PerkReport {
  id: string;
  hotel_id: string;
  user_id: string | null;
  display_name: string;
  elite_tier: EliteTier;
  category: PerkCategory;
  description: string;
  created_at: string;
  stay_date: string | null;
  booking_type: string | null;
  promo_code: string | null;
  upgrade_type: string | null;
  category_details: Record<string, string | number | null> | null;
  edit_count: number;
  last_edited_at: string | null;
}

export interface Comment {
  id: string;
  hotel_id: string;
  user_id: string | null;
  display_name: string;
  elite_tier: EliteTier;
  text: string;
  created_at: string;
}

export interface Upvote {
  id: string;
  perk_report_id: string;
  user_id: string;
  created_at: string;
}

export interface PerkVote {
  id?: string;
  perk_id: string;
  user_id: string;
  vote: number;
}

export interface HotelRequest {
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
  status: "pending" | "approved" | "rejected" | "duplicate";
  reviewed_by: string | null;
  reviewed_at: string | null;
  hotel_id: string | null;
  notification_sent_at: string | null;
  notification_error: string | null;
  created_at: string;
}

export interface UserProfile {
  id: string;
  display_name: string | null;
  bio: string | null;
  elite_tier: EliteTier | null;
  elite_since: string | null;
  reddit_username: string | null;
}

export interface LeaderboardRow {
  user_id: string;
  display_name: string;
  elite_tier: EliteTier | null;
  perk_count: number;
  upvote_count: number;
  comment_count: number;
  total_score: number;
  badge: string;
}

export interface AggregatedPerk {
  hotel_id: string;
  elite_tier: EliteTier;
  category: PerkCategory;
  summary: string;
  report_count: number;
  upvote_count: number;
  total_confirmations: number;
  confidence: "high" | "medium" | "low";
  last_reported: string;
}

export interface HotelRepresentative {
  id: string;
  user_id: string;
  hotel_id: string;
  verified: boolean;
  verified_at: string | null;
  verification_method: "email_domain" | "admin_review" | null;
  created_at: string;
}

export interface AiSummary {
  id: string;
  hotel_id: string;
  summary: {
    text: string;
    highlights: string[];
    generated_model: string;
  };
  perk_count_at_generation: number;
  generated_at: string;
}

export interface TierDef {
  key: EliteTier;
  label: string;
  color: string;
}

export interface CategoryDef {
  key: PerkCategory;
  icon: string;
  label: string;
}

export interface CategoryFieldDef {
  key: string;
  label: string;
  type: "select" | "text" | "rating";
  options?: string[];
  max?: number;
  placeholder?: string;
  showIf?: (details: Record<string, string | number | null>) => boolean;
}

export interface PerkFilter {
  key: string;
  label: string;
  test: (perks: PerkReport[] | undefined) => boolean;
}

export type ConfidenceLevel = "high" | "medium" | "low";
export type PerkOutcome = "received" | "not_received";
