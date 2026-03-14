import { supabase } from "@/integrations/supabase/client";

// ── Karma Reasons & Deltas ──────────────────────────────────

export type KarmaReason =
  | "profile_completed"
  | "avatar_uploaded"
  | "first_trip_created"
  | "trip_created"
  | "helper_trip_created"
  | "connection_sent"
  | "connection_accepted"
  | "connection_accepted_requester"
  | "endorsement_given"
  | "endorsement_received";

const KARMA_DELTAS: Record<KarmaReason, number> = {
  profile_completed: 10,
  avatar_uploaded: 5,
  first_trip_created: 5,
  trip_created: 2,
  helper_trip_created: 3,
  connection_sent: 1,
  connection_accepted: 2,
  connection_accepted_requester: 1,
  endorsement_given: 2,
  endorsement_received: 3,
};

const ONE_TIME_REASONS: Set<KarmaReason> = new Set([
  "profile_completed",
  "avatar_uploaded",
  "first_trip_created",
]);

export const KARMA_REASON_LABELS: Record<KarmaReason, string> = {
  profile_completed: "Completed profile",
  avatar_uploaded: "Uploaded avatar",
  first_trip_created: "Created first trip",
  trip_created: "Created a trip",
  helper_trip_created: "Offered to help",
  connection_sent: "Sent connection request",
  connection_accepted: "Accepted a connection",
  connection_accepted_requester: "Connection was accepted",
  endorsement_given: "Gave an endorsement",
  endorsement_received: "Received an endorsement",
};

// ── Karma Tiers ─────────────────────────────────────────────

export interface KarmaTier {
  name: string;
  minPoints: number;
  icon: "seedling" | "footprints" | "heart-handshake" | "users" | "star";
}

export const KARMA_TIERS: KarmaTier[] = [
  { name: "New Traveler", minPoints: 0, icon: "seedling" },
  { name: "Friendly Traveler", minPoints: 10, icon: "footprints" },
  { name: "Trusted Companion", minPoints: 30, icon: "heart-handshake" },
  { name: "Community Guide", minPoints: 75, icon: "users" },
  { name: "Ambassador", minPoints: 150, icon: "star" },
];

export function getKarmaTier(score: number): KarmaTier {
  for (let i = KARMA_TIERS.length - 1; i >= 0; i--) {
    if (score >= KARMA_TIERS[i].minPoints) return KARMA_TIERS[i];
  }
  return KARMA_TIERS[0];
}

// ── Endorsement Tags (shared constants) ─────────────────────

export const ENDORSEMENT_TAGS = [
  "airport_pickup",
  "local_guide",
  "translation",
  "accommodation",
  "food_recommendations",
  "emergency_contact",
  "document_help",
  "transport",
] as const;

export const ENDORSEMENT_TAG_LABELS: Record<string, string> = {
  airport_pickup: "Airport Pickup",
  local_guide: "Local Guide",
  translation: "Translation",
  accommodation: "Accommodation",
  food_recommendations: "Food Recs",
  emergency_contact: "Emergency Contact",
  document_help: "Document Help",
  transport: "Transport",
};

// ── Award Karma ─────────────────────────────────────────────

export async function awardKarma(
  userId: string,
  reason: KarmaReason,
  refId?: string
): Promise<boolean> {
  const delta = KARMA_DELTAS[reason];
  if (!delta) return false;

  // For one-time awards, check if already awarded
  if (ONE_TIME_REASONS.has(reason)) {
    const { data: existing } = await supabase
      .from("karma_log")
      .select("id")
      .eq("user_id", userId)
      .eq("reason", reason)
      .limit(1);

    if (existing && existing.length > 0) return false;
  }

  // Insert karma log entry
  const { error: logError } = await supabase.from("karma_log").insert({
    user_id: userId,
    delta,
    reason,
    ref_id: refId ?? null,
  });

  if (logError) {
    console.error("Karma log insert failed:", logError);
    return false;
  }

  // Increment profile karma_score
  const { data: profile } = await supabase
    .from("profiles")
    .select("karma_score")
    .eq("user_id", userId)
    .single();

  const currentScore = profile?.karma_score ?? 0;
  await supabase
    .from("profiles")
    .update({ karma_score: currentScore + delta })
    .eq("user_id", userId);

  return true;
}
