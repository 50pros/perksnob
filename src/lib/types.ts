/* Domain primitives -------------------------------------------------------- */
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

export type PerkSource = "hotel" | "community" | "admin";
export type VerificationOutcome = "received" | "not_received" | "partial";
export type ClaimStatus = "pending" | "verified" | "rejected" | "revoked";

/* Tables ------------------------------------------------------------------- */
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

export interface HotelPerk {
  id: string;
  hotel_id: string;
  elite_tier: EliteTier | "all";
  category: PerkCategory;
  offered: boolean;
  details: Record<string, string | number | null>;
  notes: string | null;
  source: PerkSource;
  declared_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PerkVerification {
  id: string;
  hotel_perk_id: string;
  user_id: string;
  outcome: VerificationOutcome;
  elite_tier: EliteTier | null;
  stay_date: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface HotelClaim {
  id: string;
  hotel_id: string;
  user_id: string;
  role: string;
  status: ClaimStatus;
  verification_method: "email_link" | "admin" | null;
  verified_at: string | null;
  created_at: string;
}

/* View models -------------------------------------------------------------- */
export interface CommunityPerk {
  category: PerkCategory;
  reports: number;
  tiers: EliteTier[];
  received: number;
  notReceived: number;
  deliveryRate: number | null; // received / (received + notReceived)
  sample: string | null;
}

/* Config shapes consumed by constants.ts ---------------------------------- */
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
