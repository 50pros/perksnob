import type {
  TierDef,
  CategoryDef,
  CategoryFieldDef,
  PerkCategory,
  EliteTier,
  Brand,
} from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  Tier & category definitions                                       */
/* ------------------------------------------------------------------ */

export const TIERS: TierDef[] = [
  { key: "ambassador", label: "Ambassador Elite", color: "#1a1a1a" },
  { key: "titanium", label: "Titanium Elite", color: "#6b7280" },
  { key: "platinum", label: "Platinum Elite", color: "#9ca3af" },
  { key: "gold", label: "Gold Elite", color: "#d97706" },
  { key: "silver", label: "Silver Elite", color: "#a3a3a3" },
];

export const CATS: CategoryDef[] = [
  { key: "breakfast", icon: "\u{1F373}", label: "Breakfast" },
  { key: "lounge", icon: "\u{1F378}", label: "Lounge Access" },
  { key: "drinks", icon: "\u2615", label: "Drinks & Coffee" },
  { key: "upgrade", icon: "\u2B06\uFE0F", label: "Room Upgrades" },
  { key: "gift", icon: "\u{1F381}", label: "Welcome Gift" },
  { key: "late_checkout", icon: "\u{1F550}", label: "Late Checkout" },
  { key: "spa", icon: "\u{1F486}", label: "Spa & Wellness" },
  { key: "parking", icon: "\u{1F17F}\uFE0F", label: "Parking" },
  { key: "fnb_credit", icon: "\u{1F4B3}", label: "F&B Credit" },
  { key: "housekeeping", icon: "\u{1F9F9}", label: "Housekeeping" },
  { key: "bathroom", icon: "\u{1F6BF}", label: "Bathroom" },
  { key: "wifi", icon: "\u{1F4F6}", label: "WiFi & Internet" },
  { key: "shower", icon: "\u{1F6B0}", label: "Shower & Water Pressure" },
  { key: "security", icon: "\u{1F512}", label: "Room Security" },
  { key: "pool", icon: "\u{1F3CA}", label: "Pool & Fitness" },
  { key: "staff_service", icon: "\u{1F91D}", label: "Staff & Service Quality" },
  { key: "restaurant", icon: "\u{1F37D}\uFE0F", label: "Restaurant & Bar Hours" },
  { key: "other", icon: "\u2728", label: "Other" },
];

export const BRANDS: Brand[] = [
  "The Ritz-Carlton",
  "St. Regis",
  "W Hotels",
  "EDITION",
  "The Luxury Collection",
  "JW Marriott",
  "Westin",
  "Sheraton",
  "Marriott",
  "Autograph Collection",
  "Tribute Portfolio",
  "Design Hotels",
];

export const BOOKING_TYPES: string[] = [
  "Direct (Marriott Bonvoy)",
  "Points",
  "Amex FHR",
  "Virtuoso",
  "STARS",
  "Corporate",
  "Employee (MMF, MMP, etc.)",
  "Credit Card (e.g. AmEx Travel)",
  "3rd Party (e.g. Priceline)",
  "Other",
];

export const UPGRADE_TYPES: string[] = [
  "Same category, better room",
  "Higher category",
  "Suite upgrade",
];

/* ------------------------------------------------------------------ */
/*  Per-category form field definitions                               */
/* ------------------------------------------------------------------ */

export const CATEGORY_FIELDS: Record<PerkCategory, CategoryFieldDef[]> = {
  breakfast: [
    {
      key: "cost",
      label: "Cost",
      type: "select",
      options: ["Complimentary", "Voucher/Credit", "Discounted", "Not included"],
    },
    {
      key: "credit_amount",
      label: "Amount",
      type: "text",
      placeholder: "e.g. $50/person",
      showIf: (d) =>
        d.cost === "Voucher/Credit" || d.cost === "Discounted",
    },
    {
      key: "style",
      label: "Style",
      type: "select",
      options: ["Full breakfast", "Continental", "Both options"],
    },
    {
      key: "format",
      label: "Format",
      type: "select",
      options: ["Buffet", "\u00C0 la carte", "Both"],
    },
    { key: "quality", label: "Quality", type: "rating", max: 5 },
    {
      key: "hot_food",
      label: "Hot food?",
      type: "select",
      options: ["Yes", "No"],
    },
    {
      key: "location",
      label: "Where?",
      type: "text",
      placeholder: "e.g. Main restaurant, club lounge",
    },
  ],

  lounge: [
    {
      key: "status",
      label: "Status",
      type: "select",
      options: ["Open", "Closed", "Renovating", "No lounge"],
    },
    {
      key: "hours",
      label: "Hours",
      type: "text",
      placeholder: "e.g. 6am\u201310pm",
    },
    {
      key: "food_type",
      label: "Food",
      type: "select",
      options: ["Full meals", "Snacks & appetizers", "Drinks only", "No food"],
    },
    {
      key: "evening_apps",
      label: "Evening appetizers?",
      type: "select",
      options: ["Yes, hot food", "Yes, light bites", "No"],
    },
    {
      key: "alcohol",
      label: "Alcohol served?",
      type: "select",
      options: ["Yes, full bar", "Yes, beer & wine", "No"],
    },
    { key: "quality", label: "Quality", type: "rating", max: 5 },
  ],

  upgrade: [
    {
      key: "stay_length",
      label: "Stay length",
      type: "select",
      options: ["1\u20132 nights", "3\u20134 nights", "5+ nights"],
    },
    {
      key: "how_granted",
      label: "How granted?",
      type: "select",
      options: [
        "Proactive (at check-in)",
        "Upon request",
        "Through app/SNNA",
        "Not granted",
      ],
    },
    {
      key: "floors_up",
      label: "Floors upgraded",
      type: "select",
      options: [
        "Same floor",
        "1\u20133 floors up",
        "4+ floors up",
        "Top floor",
        "N/A",
      ],
    },
    {
      key: "room_offered",
      label: "Room type offered",
      type: "text",
      placeholder: "e.g. Ocean view suite, Club level king",
    },
  ],

  gift: [
    {
      key: "gift_type",
      label: "Type",
      type: "select",
      options: [
        "Food & beverage platter",
        "Bottle of wine/champagne",
        "Amenity (non-food)",
        "Welcome letter + points",
        "Resort credit",
        "Nothing",
      ],
    },
    {
      key: "gift_detail",
      label: "Specific item",
      type: "text",
      placeholder: "e.g. Chocolate truffles & fruit plate",
    },
  ],

  late_checkout: [
    {
      key: "time_granted",
      label: "Time granted",
      type: "select",
      options: ["1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "No late checkout"],
    },
    {
      key: "how_lco",
      label: "How?",
      type: "select",
      options: [
        "Proactive (offered at check-in)",
        "Upon request",
        "Via app",
        "Denied",
      ],
    },
  ],

  spa: [
    {
      key: "spa_type",
      label: "What was offered?",
      type: "select",
      options: [
        "Free treatment",
        "Credit/discount",
        "Free facility access only",
        "Discount on treatments",
        "Nothing",
      ],
    },
    {
      key: "spa_amount",
      label: "Amount",
      type: "text",
      placeholder: "e.g. $50 credit, 20% off",
      showIf: (d) =>
        d.spa_type === "Credit/discount" ||
        d.spa_type === "Discount on treatments",
    },
    {
      key: "spa_detail",
      label: "Details",
      type: "text",
      placeholder: "e.g. Sauna, pool, gym access included",
    },
  ],

  fnb_credit: [
    {
      key: "amount",
      label: "Amount",
      type: "text",
      placeholder: "e.g. $50",
    },
    {
      key: "frequency",
      label: "Per",
      type: "select",
      options: ["Per night", "Per stay", "Per person/night", "One-time"],
    },
    {
      key: "where",
      label: "Where usable?",
      type: "select",
      options: [
        "Any restaurant",
        "Specific restaurant",
        "Bar only",
        "Room service",
        "Any outlet",
      ],
    },
    {
      key: "fnb_detail",
      label: "Restaurant name",
      type: "text",
      placeholder: "e.g. The Grill, Lobby Bar",
    },
  ],

  parking: [
    {
      key: "included",
      label: "Included free?",
      type: "select",
      options: ["Yes, free", "Discounted", "No, full price"],
    },
    {
      key: "parking_type",
      label: "Type",
      type: "select",
      options: ["Self-park", "Valet", "Both available"],
    },
    {
      key: "daily_rate",
      label: "Daily rate",
      type: "text",
      placeholder: "e.g. $45/night",
      showIf: (d) => d.included !== "Yes, free",
    },
  ],

  housekeeping: [
    {
      key: "frequency",
      label: "Frequency",
      type: "select",
      options: ["Daily", "Every other day", "On request only", "Not offered"],
    },
    {
      key: "turndown",
      label: "Turndown service?",
      type: "select",
      options: ["Yes, daily", "Yes, on request", "No"],
    },
  ],

  bathroom: [
    {
      key: "door_type",
      label: "Door type",
      type: "select",
      options: [
        "Solid wood/standard",
        "Frosted glass",
        "Clear/see-through glass",
        "Open concept (no door)",
        "Sliding barn door",
        "Pocket door",
      ],
    },
    {
      key: "separate_toilet",
      label: "Separate toilet room?",
      type: "select",
      options: ["Yes", "No"],
    },
    {
      key: "bath_type",
      label: "Bath/Shower",
      type: "select",
      options: [
        "Tub & separate shower",
        "Tub/shower combo",
        "Shower only",
        "Soaking tub & shower",
        "Rain shower",
      ],
    },
    {
      key: "dual_vanity",
      label: "Dual vanity?",
      type: "select",
      options: ["Yes", "No"],
    },
  ],

  drinks: [
    {
      key: "drink_type",
      label: "What's offered?",
      type: "select",
      options: [
        "In-room coffee machine",
        "Lobby caf\u00E9/bar",
        "Lounge access",
        "Complimentary at restaurant",
        "Minibar credit",
        "Welcome drinks",
      ],
    },
    {
      key: "machine_type",
      label: "Machine",
      type: "text",
      placeholder: "e.g. Nespresso, Illy, Keurig",
      showIf: (d) => d.drink_type === "In-room coffee machine",
    },
    {
      key: "drink_detail",
      label: "Details",
      type: "text",
      placeholder: "e.g. 2 free drinks at lobby bar per night",
    },
  ],

  wifi: [
    {
      key: "speed",
      label: "Speed quality",
      type: "select",
      options: [
        "Excellent (50+ Mbps)",
        "Good (20\u201350 Mbps)",
        "Acceptable (10\u201320 Mbps)",
        "Slow (under 10 Mbps)",
        "Unusable",
      ],
    },
    {
      key: "elite_faster",
      label: "Elite faster internet?",
      type: "select",
      options: [
        "Yes, noticeably faster",
        "Same as regular",
        "Didn't notice a difference",
      ],
    },
    {
      key: "coverage",
      label: "Coverage in room",
      type: "select",
      options: ["Strong throughout", "Weak in some spots", "Dropped frequently"],
    },
    {
      key: "ports_blocked",
      label: "Gaming/VPN ports blocked?",
      type: "select",
      options: ["No, all open", "Yes, some blocked", "Didn't test"],
    },
  ],

  shower: [
    {
      key: "pressure",
      label: "Water pressure",
      type: "select",
      options: ["Excellent", "Good", "Weak", "Very weak"],
    },
    {
      key: "shower_type",
      label: "Shower type",
      type: "select",
      options: [
        "Fixed rainfall",
        "Handheld",
        "Both fixed & handheld",
        "Tub/shower combo",
      ],
    },
    {
      key: "hot_water",
      label: "Hot water",
      type: "select",
      options: ["Consistent", "Takes a while", "Inconsistent", "Not hot enough"],
    },
  ],

  security: [
    {
      key: "deadbolt",
      label: "Deadbolt on door?",
      type: "select",
      options: ["Yes", "No"],
    },
    {
      key: "chain_latch",
      label: "Chain/latch lock?",
      type: "select",
      options: ["Yes", "No"],
    },
    {
      key: "peephole",
      label: "Peephole?",
      type: "select",
      options: ["Yes", "No"],
    },
    {
      key: "safe",
      label: "In-room safe?",
      type: "select",
      options: ["Yes, electronic", "Yes, key", "No"],
    },
    {
      key: "security_detail",
      label: "Other notes",
      type: "text",
      placeholder: "e.g. Well-lit hallways, security camera in lobby",
    },
  ],

  pool: [
    {
      key: "pool_open",
      label: "Pool open?",
      type: "select",
      options: ["Yes", "No, closed", "Seasonal", "Under renovation"],
    },
    {
      key: "pool_type",
      label: "Type",
      type: "select",
      options: ["Indoor", "Outdoor", "Both", "Rooftop"],
    },
    { key: "pool_quality", label: "Quality", type: "rating", max: 5 },
    { key: "gym_quality", label: "Gym/fitness quality", type: "rating", max: 5 },
    {
      key: "gym_hours",
      label: "Gym hours",
      type: "text",
      placeholder: "e.g. 24/7, 6am\u201310pm",
    },
  ],

  staff_service: [
    {
      key: "honors_status",
      label: "Did staff honor your elite status?",
      type: "select",
      options: [
        "Yes, proactively recognized",
        "Yes, when mentioned",
        "No, seemed unaware",
        "Indifferent",
      ],
    },
    {
      key: "checkin_experience",
      label: "Check-in experience",
      type: "select",
      options: ["Excellent", "Good", "Average", "Poor"],
    },
    {
      key: "app_requests",
      label: "Did they honor app messages/requests?",
      type: "select",
      options: ["Yes, promptly", "Partially", "Ignored", "Didn't submit any"],
    },
    {
      key: "housekeeping_dnd",
      label: "Respected DND sign?",
      type: "select",
      options: ["Yes", "No, knocked anyway", "No, entered room"],
    },
    {
      key: "overall_service",
      label: "Overall service quality",
      type: "rating",
      max: 5,
    },
  ],

  restaurant: [
    {
      key: "hours_accurate",
      label: "Are posted hours accurate?",
      type: "select",
      options: [
        "Yes",
        "No, closes early sometimes",
        "No, random closures",
        "Reduced from advertised",
      ],
    },
    {
      key: "days_closed",
      label: "Closed any days?",
      type: "text",
      placeholder: "e.g. Closed Sundays & Mondays",
    },
    {
      key: "room_service",
      label: "Room service available?",
      type: "select",
      options: ["Yes, full menu", "Yes, limited menu", "No room service"],
    },
    {
      key: "room_service_quality",
      label: "Room service quality",
      type: "rating",
      max: 5,
      showIf: (d) =>
        typeof d.room_service === "string" &&
        d.room_service.startsWith("Yes"),
    },
    {
      key: "restaurant_detail",
      label: "Notes",
      type: "text",
      placeholder:
        "e.g. Bar closes at 10pm despite advertising midnight",
    },
  ],

  other: [],
};

/* ------------------------------------------------------------------ */
/*  Numeric limits                                                    */
/* ------------------------------------------------------------------ */

export const MAX_DESC = 500;
export const MAX_NAME = 30;
export const MAX_TIP = 300;
export const MAX_HOTEL_REQUEST_NOTES = 300;

/* ------------------------------------------------------------------ */
/*  Perk category descriptions                                        */
/* ------------------------------------------------------------------ */

export const PERK_CATEGORY_DESC: Record<PerkCategory, string> = {
  breakfast: "Breakfast access and cost for elite stays.",
  lounge: "Executive lounge access and whether it was open.",
  drinks: "Coffee, drinks, minibar, or welcome beverages.",
  upgrade: "Room upgrade outcomes at check-in.",
  gift: "Welcome gifts, amenities, or points options.",
  late_checkout: "Late checkout availability and time granted.",
  spa: "Spa credits, discounts, and facility access.",
  parking: "Parking included free, discounted, or full price.",
  fnb_credit: "Food and beverage credits and usage scope.",
  housekeeping: "Housekeeping frequency and turndown service.",
  bathroom: "Bathroom setup, privacy, and condition details.",
  wifi: "WiFi speed, reliability, and elite internet.",
  shower: "Shower pressure, type, and hot water consistency.",
  security: "Room safety features like deadbolt/safe.",
  pool: "Pool and gym availability and quality.",
  staff_service: "Status recognition and service consistency.",
  restaurant: "Restaurant/bar hours and room service coverage.",
  other: "Other property-specific perks and notes.",
};

/* ------------------------------------------------------------------ */
/*  Profanity / moderation                                            */
/* ------------------------------------------------------------------ */

export const PROFANITY_PATTERNS: RegExp[] = [
  /\bfuck(?:er|ers|ing|ed|s)?\b/i,
  /\bshit(?:ty|head|heads|s)?\b/i,
  /\basshole(?:s)?\b/i,
  /\bbitch(?:es|y)?\b/i,
  /\bdick(?:head|heads|s)?\b/i,
  /\bcock\b/i,
  /\bpussy\b/i,
  /\bslut(?:s)?\b/i,
  /\bwhore(?:s)?\b/i,
  /\bnigg(?:er|a)s?\b/i,
  /\bfaggot(?:s)?\b/i,
  /\bretard(?:ed|s)?\b/i,
  /\bcunt(?:s)?\b/i,
];

export const RESERVED_NAMES: string[] = [
  "admin",
  "administrator",
  "marriott",
  "marriottofficial",
  "marriottglobal",
  "marriottbonvoy",
  "bonvoy",
  "hilton",
  "hyatt",
  "ihg",
  "perksnob",
  "perksnobofficial",
  "moderator",
  "mod",
  "staff",
  "official",
  "support",
  "helpdesk",
  "system",
  "bot",
  "ritzcarlton",
  "stregis",
  "westinhotels",
  "sheratonhotels",
  "jwmarriott",
  "whotels",
  "editionhotels",
];

/* ------------------------------------------------------------------ */
/*  Pagination / feature-gates                                        */
/* ------------------------------------------------------------------ */

export const PAGE_SIZE = 50;
export const EMAIL_GATE_DAYS = 7;

/* ------------------------------------------------------------------ */
/*  Implied-negative detection per category                           */
/* ------------------------------------------------------------------ */

type CategoryDetails = Record<string, string | number | null>;

export const IMPLIED_NEGATIVE_BY_CATEGORY: Partial<
  Record<PerkCategory, (d: CategoryDetails | null | undefined) => boolean>
> = {
  breakfast: (d) => d?.cost === "Not included",
  lounge: (d) =>
    d?.status === "Closed" ||
    d?.status === "No lounge" ||
    d?.status === "Renovating",
  upgrade: (d) => d?.how_granted === "Not granted",
  gift: (d) => d?.gift_type === "Nothing",
  late_checkout: (d) =>
    d?.time_granted === "No late checkout" || d?.how_lco === "Denied",
  spa: (d) => d?.spa_type === "Nothing",
  parking: (d) => d?.included === "No, full price",
  housekeeping: (d) => d?.frequency === "Not offered",
  wifi: (d) => d?.speed === "Unusable",
  shower: (d) => d?.pressure === "Very weak",
  pool: (d) =>
    d?.pool_open === "No, closed" || d?.pool_open === "Under renovation",
  staff_service: (d) =>
    d?.honors_status === "No, seemed unaware" ||
    d?.honors_status === "Indifferent",
};
