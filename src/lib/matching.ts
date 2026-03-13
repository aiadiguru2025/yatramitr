/**
 * YatraMitr Travel Companion Matching Algorithm
 *
 * Scores potential travel companions on multiple factors:
 * - Destination compatibility (25%)
 * - Date overlap (20%)
 * - Travel style (15%)
 * - Shared interests / help tags (15%)
 * - Budget compatibility (10%)
 * - Demographics (8%)
 * - Preferences (7%)
 *
 * Returns a 0–100 score with per-factor breakdown.
 */

// ── Types ───────────────────────────────────────────────────────────────

export interface TripData {
  dest_city: string;
  dest_country?: string;
  dest_region?: string;
  origin_city: string;
  origin_country?: string;
  travel_date: string;        // ISO date
  return_date?: string | null; // ISO date
  role: "traveller" | "helper";
}

export interface HelpData {
  needs_help_with: string[];
  can_help_with: string[];
}

export interface TravelPreferences {
  travel_pace?: "slow" | "moderate" | "fast" | null;
  planning_style?: "spontaneous" | "flexible" | "structured" | null;
  accommodation_pref?: "budget" | "mid_range" | "luxury" | null;
  interests?: string[] | null;
  must_have_interests?: string[] | null;
  smoking?: boolean | null;
  dietary?: "none" | "vegetarian" | "vegan" | "halal" | "kosher" | null;
  solo_experience?: "none" | "some" | "experienced" | null;
  date_flexible?: boolean | null;
  gender_preference?: "any" | "same" | "male" | "female" | null;
}

export interface UserMatchProfile {
  user_id: string;
  birth_year?: number | null;
  gender?: string | null;
  languages?: string[] | null;
  home_city?: string | null;
  trips: TripData[];
  help: HelpData | null;
  prefs: TravelPreferences | null;
}

export interface FactorScore {
  score: number;   // 0–1
  weight: number;  // configured weight
  detail: string;  // human-readable explanation
}

export interface MatchResult {
  user_id: string;
  overall: number;  // 0–100
  factors: {
    destination: FactorScore;
    dates: FactorScore;
    travel_style: FactorScore;
    interests: FactorScore;
    budget: FactorScore;
    demographics: FactorScore;
    preferences: FactorScore;
  };
}

export interface MatchWeights {
  destination: number;
  dates: number;
  travel_style: number;
  interests: number;
  budget: number;
  demographics: number;
  preferences: number;
}

// ── Defaults ────────────────────────────────────────────────────────────

const DEFAULT_WEIGHTS: MatchWeights = {
  destination: 0.25,
  dates: 0.20,
  travel_style: 0.15,
  interests: 0.15,
  budget: 0.10,
  demographics: 0.08,
  preferences: 0.07,
};

const DEFAULT_THRESHOLD = 60;

// ── Ordered enum scales for distance-based scoring ──────────────────────

const PACE_ORDER = ["slow", "moderate", "fast"];
const PLANNING_ORDER = ["spontaneous", "flexible", "structured"];
const ACCOMMODATION_ORDER = ["budget", "mid_range", "luxury"];
const EXPERIENCE_ORDER = ["none", "some", "experienced"];

// ── Helpers ─────────────────────────────────────────────────────────────

function enumDistance(a: string, b: string, scale: string[]): number {
  const ia = scale.indexOf(a);
  const ib = scale.indexOf(b);
  if (ia === -1 || ib === -1) return 0.5; // unknown → neutral
  return 1 - Math.abs(ia - ib) / (scale.length - 1);
}

function jaccard(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 0;
  const setA = new Set(a);
  const setB = new Set(b);
  const intersection = [...setA].filter(x => setB.has(x)).length;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

function daysBetween(a: string, b: string): number {
  return Math.abs(
    (new Date(a).getTime() - new Date(b).getTime()) / (1000 * 60 * 60 * 24)
  );
}

function overlapDays(
  s1: string, e1: string | null | undefined,
  s2: string, e2: string | null | undefined
): number {
  const start1 = new Date(s1).getTime();
  const end1 = e1 ? new Date(e1).getTime() : start1 + 7 * 86400000; // default 7 days
  const start2 = new Date(s2).getTime();
  const end2 = e2 ? new Date(e2).getTime() : start2 + 7 * 86400000;

  const overlapStart = Math.max(start1, start2);
  const overlapEnd = Math.min(end1, end2);
  const overlap = (overlapEnd - overlapStart) / 86400000;
  return Math.max(0, overlap);
}

function normalize(city: string): string {
  return city.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

// ── Factor Scoring Functions ────────────────────────────────────────────

function scoreDestination(me: UserMatchProfile, them: UserMatchProfile): FactorScore {
  const weight = DEFAULT_WEIGHTS.destination;

  if (me.trips.length === 0 || them.trips.length === 0) {
    return { score: 0, weight, detail: "No trip data" };
  }

  let bestScore = 0;
  let bestDetail = "No destination match";

  for (const myTrip of me.trips) {
    for (const theirTrip of them.trips) {
      const myDest = normalize(myTrip.dest_city);
      const theirDest = normalize(theirTrip.dest_city);

      // Exact city match
      if (myDest === theirDest) {
        bestScore = 1.0;
        bestDetail = `Same city: ${myTrip.dest_city}`;
        break;
      }

      // Same country
      if (myTrip.dest_country && theirTrip.dest_country &&
          normalize(myTrip.dest_country) === normalize(theirTrip.dest_country)) {
        if (bestScore < 0.5) {
          bestScore = 0.5;
          bestDetail = `Same country: ${myTrip.dest_country}`;
        }
      }

      // Same region
      if (myTrip.dest_region && theirTrip.dest_region &&
          normalize(myTrip.dest_region) === normalize(theirTrip.dest_region)) {
        if (bestScore < 0.8) {
          bestScore = 0.8;
          bestDetail = `Same region: ${myTrip.dest_region}`;
        }
      }

      // Traveller going to helper's home city (complementary)
      if (myTrip.role === "traveller" && theirTrip.role === "helper" &&
          them.home_city && normalize(myTrip.dest_city) === normalize(them.home_city)) {
        if (bestScore < 0.9) {
          bestScore = 0.9;
          bestDetail = `Helper based in your destination`;
        }
      }
      if (theirTrip.role === "traveller" && myTrip.role === "helper" &&
          me.home_city && normalize(theirTrip.dest_city) === normalize(me.home_city)) {
        if (bestScore < 0.9) {
          bestScore = 0.9;
          bestDetail = `You can help at their destination`;
        }
      }
    }
    if (bestScore === 1.0) break;
  }

  return { score: bestScore, weight, detail: bestDetail };
}

function scoreDates(me: UserMatchProfile, them: UserMatchProfile): FactorScore {
  const weight = DEFAULT_WEIGHTS.dates;

  if (me.trips.length === 0 || them.trips.length === 0) {
    return { score: 0, weight, detail: "No trip data" };
  }

  let bestScore = 0;
  let bestDetail = "No date overlap";

  for (const myTrip of me.trips) {
    for (const theirTrip of them.trips) {
      const overlap = overlapDays(
        myTrip.travel_date, myTrip.return_date,
        theirTrip.travel_date, theirTrip.return_date
      );

      if (overlap <= 0) continue;

      // Score based on overlap relative to shorter trip duration
      const myDuration = myTrip.return_date
        ? daysBetween(myTrip.travel_date, myTrip.return_date)
        : 7;
      const theirDuration = theirTrip.return_date
        ? daysBetween(theirTrip.travel_date, theirTrip.return_date)
        : 7;
      const minDuration = Math.max(1, Math.min(myDuration, theirDuration));

      let score = Math.min(1, overlap / minDuration);

      // Flexibility bonus
      const myFlex = me.prefs?.date_flexible;
      const theirFlex = them.prefs?.date_flexible;
      if (myFlex || theirFlex) {
        score = Math.min(1, score + 0.15);
      }

      if (score > bestScore) {
        bestScore = score;
        bestDetail = `${Math.round(overlap)} days overlap`;
        if (myFlex || theirFlex) bestDetail += " (+flexible)";
      }
    }
  }

  return { score: bestScore, weight, detail: bestDetail };
}

function scoreTravelStyle(me: UserMatchProfile, them: UserMatchProfile): FactorScore {
  const weight = DEFAULT_WEIGHTS.travel_style;
  const mp = me.prefs;
  const tp = them.prefs;

  if (!mp || !tp) {
    return { score: 0, weight, detail: "No style preferences" };
  }

  const scores: number[] = [];
  const details: string[] = [];

  if (mp.travel_pace && tp.travel_pace) {
    const s = enumDistance(mp.travel_pace, tp.travel_pace, PACE_ORDER);
    scores.push(s);
    if (s >= 0.8) details.push("similar pace");
  }

  if (mp.planning_style && tp.planning_style) {
    const s = enumDistance(mp.planning_style, tp.planning_style, PLANNING_ORDER);
    scores.push(s);
    if (s >= 0.8) details.push("compatible planning");
  }

  if (mp.accommodation_pref && tp.accommodation_pref) {
    const s = enumDistance(mp.accommodation_pref, tp.accommodation_pref, ACCOMMODATION_ORDER);
    scores.push(s);
    if (s >= 0.8) details.push("similar accommodation");
  }

  if (scores.length === 0) {
    return { score: 0, weight, detail: "No style data" };
  }

  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return {
    score: avg,
    weight,
    detail: details.length > 0 ? details.join(", ") : "Style differences noted",
  };
}

function scoreInterests(me: UserMatchProfile, them: UserMatchProfile): FactorScore {
  const weight = DEFAULT_WEIGHTS.interests;

  // Combine help tags + interest tags for a richer picture
  const myInterests = [
    ...(me.prefs?.interests || []),
    ...(me.help?.needs_help_with || []),
    ...(me.help?.can_help_with || []),
  ];
  const theirInterests = [
    ...(them.prefs?.interests || []),
    ...(them.help?.needs_help_with || []),
    ...(them.help?.can_help_with || []),
  ];

  if (myInterests.length === 0 && theirInterests.length === 0) {
    return { score: 0, weight, detail: "No interest data" };
  }

  // Jaccard similarity on all interests
  let score = jaccard(myInterests, theirInterests);

  // Complementary help: I need what they offer, they need what I offer
  const myNeeds = new Set(me.help?.needs_help_with || []);
  const theirOffers = new Set(them.help?.can_help_with || []);
  const theirNeeds = new Set(them.help?.needs_help_with || []);
  const myOffers = new Set(me.help?.can_help_with || []);

  const complementary1 = [...myNeeds].filter(x => theirOffers.has(x)).length;
  const complementary2 = [...theirNeeds].filter(x => myOffers.has(x)).length;
  const totalNeeds = myNeeds.size + theirNeeds.size;

  if (totalNeeds > 0) {
    const complementaryScore = (complementary1 + complementary2) / totalNeeds;
    // Blend: 60% Jaccard + 40% complementary
    score = score * 0.6 + complementaryScore * 0.4;
  }

  // Must-have interests check
  const mustHave = me.prefs?.must_have_interests || [];
  if (mustHave.length > 0) {
    const theirSet = new Set(theirInterests);
    const matched = mustHave.filter(i => theirSet.has(i)).length;
    const mustHaveRate = matched / mustHave.length;
    // Penalize if must-haves aren't met
    score = score * (0.5 + 0.5 * mustHaveRate);
  }

  const common = myInterests.filter(i => theirInterests.includes(i));
  const detail = common.length > 0
    ? `${common.length} shared interest${common.length > 1 ? "s" : ""}` +
      (complementary1 + complementary2 > 0 ? `, ${complementary1 + complementary2} complementary` : "")
    : "Few shared interests";

  return { score: Math.min(1, score), weight, detail };
}

function scoreBudget(_me: UserMatchProfile, _them: UserMatchProfile): FactorScore {
  return { score: 0, weight: DEFAULT_WEIGHTS.budget, detail: "No budget data" };
}

function scoreDemographics(me: UserMatchProfile, them: UserMatchProfile): FactorScore {
  const weight = DEFAULT_WEIGHTS.demographics;
  const scores: number[] = [];
  const details: string[] = [];

  // Age similarity (1 - diff/30, min 0)
  if (me.birth_year && them.birth_year) {
    const ageDiff = Math.abs(me.birth_year - them.birth_year);
    const ageScore = Math.max(0, 1 - ageDiff / 30);
    scores.push(ageScore);
    if (ageDiff <= 5) details.push("similar age");
  }

  // Gender preference match
  if (me.prefs?.gender_preference && me.prefs.gender_preference !== "any") {
    if (me.prefs.gender_preference === "same") {
      scores.push(me.gender === them.gender ? 1 : 0);
    } else {
      scores.push(them.gender === me.prefs.gender_preference ? 1 : 0);
    }
  }

  // Language overlap
  if (me.languages?.length && them.languages?.length) {
    const common = me.languages.filter(l => them.languages!.includes(l));
    const langScore = common.length > 0 ? Math.min(1, common.length / Math.min(me.languages.length, them.languages.length)) : 0;
    scores.push(langScore);
    if (common.length > 0) details.push(`${common.length} common language${common.length > 1 ? "s" : ""}`);
  }

  if (scores.length === 0) {
    return { score: 0.5, weight, detail: "No demographic data" };
  }

  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return {
    score: avg,
    weight,
    detail: details.length > 0 ? details.join(", ") : "Some demographic differences",
  };
}

function scorePreferences(me: UserMatchProfile, them: UserMatchProfile): FactorScore {
  const weight = DEFAULT_WEIGHTS.preferences;
  const mp = me.prefs;
  const tp = them.prefs;

  if (!mp || !tp) {
    return { score: 0.5, weight, detail: "No preference data" };
  }

  const scores: number[] = [];
  const details: string[] = [];

  // Smoking compatibility
  if (mp.smoking !== null && mp.smoking !== undefined &&
      tp.smoking !== null && tp.smoking !== undefined) {
    scores.push(mp.smoking === tp.smoking ? 1 : 0.3);
    if (mp.smoking === tp.smoking) details.push("smoking match");
  }

  // Dietary compatibility
  if (mp.dietary && tp.dietary) {
    if (mp.dietary === tp.dietary) {
      scores.push(1);
      details.push("same dietary");
    } else if (mp.dietary === "none" || tp.dietary === "none") {
      scores.push(0.7); // one has no restrictions
    } else {
      scores.push(0.3); // different restrictions
    }
  }

  // Solo travel experience
  if (mp.solo_experience && tp.solo_experience) {
    const s = enumDistance(mp.solo_experience, tp.solo_experience, EXPERIENCE_ORDER);
    scores.push(s);
  }

  if (scores.length === 0) {
    return { score: 0.5, weight, detail: "No preference data" };
  }

  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return {
    score: avg,
    weight,
    detail: details.length > 0 ? details.join(", ") : "Preference differences noted",
  };
}

// ── Main Matching Function ──────────────────────────────────────────────

export function calculateMatch(
  me: UserMatchProfile,
  them: UserMatchProfile,
  customWeights?: Partial<MatchWeights>
): MatchResult {
  const weights = { ...DEFAULT_WEIGHTS, ...customWeights };

  const factors = {
    destination: scoreDestination(me, them),
    dates: scoreDates(me, them),
    travel_style: scoreTravelStyle(me, them),
    interests: scoreInterests(me, them),
    budget: scoreBudget(me, them),
    demographics: scoreDemographics(me, them),
    preferences: scorePreferences(me, them),
  };

  // Apply custom weights
  for (const key of Object.keys(factors) as (keyof typeof factors)[]) {
    factors[key].weight = weights[key];
  }

  // Redistribute weights from factors with no data
  const factorsWithData = Object.values(factors).filter(f => f.detail !== "No trip data" && f.detail !== "No style preferences" && f.detail !== "No style data" && f.detail !== "No budget data" && f.detail !== "No interest data");
  const factorsWithoutData = Object.values(factors).filter(f => !factorsWithData.includes(f));

  const deadWeight = factorsWithoutData.reduce((s, f) => s + f.weight, 0);
  const liveWeight = factorsWithData.reduce((s, f) => s + f.weight, 0);

  // Redistribute proportionally
  if (liveWeight > 0 && deadWeight > 0) {
    for (const f of factorsWithData) {
      f.weight = f.weight + (f.weight / liveWeight) * deadWeight;
    }
    for (const f of factorsWithoutData) {
      f.weight = 0;
    }
  }

  // Weighted average
  const totalWeight = Object.values(factors).reduce((s, f) => s + f.weight, 0);
  const overall = totalWeight === 0
    ? 0
    : Object.values(factors).reduce((s, f) => s + f.score * f.weight, 0) / totalWeight * 100;

  return {
    user_id: them.user_id,
    overall: Math.round(Math.max(0, Math.min(100, overall))),
    factors,
  };
}

export function rankMatches(
  me: UserMatchProfile,
  candidates: UserMatchProfile[],
  options?: {
    threshold?: number;
    weights?: Partial<MatchWeights>;
  }
): MatchResult[] {
  const threshold = options?.threshold ?? DEFAULT_THRESHOLD;

  return candidates
    .map(c => calculateMatch(me, c, options?.weights))
    .filter(m => m.overall >= threshold)
    .sort((a, b) => b.overall - a.overall);
}

// ── Interest tags for the preferences system ────────────────────────────

export const INTEREST_TAGS = [
  "photography", "hiking", "food_tours", "history",
  "nightlife", "temples", "beaches", "shopping",
  "adventure_sports", "wildlife", "yoga_meditation",
  "art_culture", "music", "volunteering",
] as const;

export const INTEREST_TAG_LABELS: Record<string, string> = {
  photography: "Photography",
  hiking: "Hiking",
  food_tours: "Food Tours",
  history: "History",
  nightlife: "Nightlife",
  temples: "Temples",
  beaches: "Beaches",
  shopping: "Shopping",
  adventure_sports: "Adventure Sports",
  wildlife: "Wildlife",
  yoga_meditation: "Yoga & Meditation",
  art_culture: "Art & Culture",
  music: "Music",
  volunteering: "Volunteering",
};
