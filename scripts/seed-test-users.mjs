#!/usr/bin/env node
/**
 * Seed test users via Supabase Admin API + direct SQL for public tables.
 *
 * Usage:
 *   node scripts/seed-test-users.mjs
 *
 * Requires VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env") });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TEST_USERS = [
  { email: "priya@test.com", password: "TestPass123!", meta: { full_name: "Priya Sharma" } },
  { email: "rahul@test.com", password: "TestPass123!", meta: { full_name: "Rahul Patel" } },
  { email: "anita@test.com", password: "TestPass123!", meta: { full_name: "Anita Desai" } },
  { email: "vikram@test.com", password: "TestPass123!", meta: { full_name: "Vikram Singh" } },
  { email: "meera@test.com", password: "TestPass123!", meta: { full_name: "Meera Krishnan" } },
  { email: "arjun@test.com", password: "TestPass123!", meta: { full_name: "Arjun Reddy" } },
];

const PROFILES = {
  "priya@test.com": {
    full_name: "Priya Sharma", display_name: "Priya",
    bio: "Solo traveller exploring Europe. Love history and street food!",
    gender: "female", birth_year: 1995,
    languages: ["English", "Hindi", "Tamil"], home_city: "DEL", home_country: "IN",
  },
  "rahul@test.com": {
    full_name: "Rahul Patel", display_name: "Rahul",
    bio: "Backpacker and photographer. Always up for an adventure.",
    gender: "male", birth_year: 1992,
    languages: ["English", "Hindi", "Gujarati"], home_city: "BOM", home_country: "IN",
  },
  "anita@test.com": {
    full_name: "Anita Desai", display_name: "Anita",
    bio: "Digital nomad working remotely. Seeking travel buddies for Southeast Asia.",
    gender: "female", birth_year: 1990,
    languages: ["English", "Hindi"], home_city: "BLR", home_country: "IN",
  },
  "vikram@test.com": {
    full_name: "Vikram Singh", display_name: "Vikram",
    bio: "Frequent flyer between India and UK. Happy to help first-time travellers.",
    gender: "male", birth_year: 1988,
    languages: ["English", "Hindi", "Punjabi"], home_city: "LHR", home_country: "GB",
  },
  "meera@test.com": {
    full_name: "Meera Krishnan", display_name: "Meera",
    bio: "Art lover and foodie. Planning my first solo trip to Japan!",
    gender: "female", birth_year: 1997,
    languages: ["English", "Malayalam", "Hindi"], home_city: "COK", home_country: "IN",
  },
  "arjun@test.com": {
    full_name: "Arjun Reddy", display_name: "Arjun",
    bio: "Tech worker in Dubai. Weekend explorer around the Middle East.",
    gender: "male", birth_year: 1993,
    languages: ["English", "Hindi", "Telugu"], home_city: "DXB", home_country: "AE",
  },
};

const TRIPS = {
  "priya@test.com": [
    { role: "traveller", origin_city: "DEL", dest_city: "CDG", dest_country: "FR", travel_date: "2026-03-25", return_date: "2026-04-05" },
    { role: "traveller", origin_city: "DEL", dest_city: "NRT", dest_country: "JP", travel_date: "2026-05-10", return_date: "2026-05-20" },
  ],
  "rahul@test.com": [
    { role: "traveller", origin_city: "BOM", dest_city: "CDG", dest_country: "FR", travel_date: "2026-03-28", return_date: "2026-04-08" },
  ],
  "anita@test.com": [
    { role: "traveller", origin_city: "BLR", dest_city: "BKK", dest_country: "TH", travel_date: "2026-04-01", return_date: "2026-04-15" },
    { role: "traveller", origin_city: "BLR", dest_city: "NRT", dest_country: "JP", travel_date: "2026-05-12", return_date: "2026-05-22" },
  ],
  "vikram@test.com": [
    { role: "helper", origin_city: "LHR", dest_city: "DEL", dest_country: "IN", travel_date: "2026-03-20", return_date: "2026-04-10" },
    { role: "helper", origin_city: "LHR", dest_city: "CDG", dest_country: "FR", travel_date: "2026-03-30", return_date: "2026-04-05" },
  ],
  "meera@test.com": [
    { role: "traveller", origin_city: "COK", dest_city: "NRT", dest_country: "JP", travel_date: "2026-05-08", return_date: "2026-05-18" },
  ],
  "arjun@test.com": [
    { role: "traveller", origin_city: "DXB", dest_city: "BKK", dest_country: "TH", travel_date: "2026-04-03", return_date: "2026-04-12" },
  ],
};

const TRAVEL_PREFS = {
  "priya@test.com": {
    travel_pace: "moderate", planning_style: "flexible", accommodation_pref: "mid_range",
    interests: ["culture", "food", "history", "photography"], must_have_interests: ["culture"],
    smoking: false, dietary: "vegetarian", solo_experience: "some", date_flexible: true, gender_preference: "any",
  },
  "rahul@test.com": {
    travel_pace: "fast", planning_style: "spontaneous", accommodation_pref: "budget",
    interests: ["adventure", "nightlife", "photography", "street_food"], must_have_interests: null,
    smoking: false, dietary: "none", solo_experience: "experienced", date_flexible: false, gender_preference: "any",
  },
  "anita@test.com": {
    travel_pace: "slow", planning_style: "structured", accommodation_pref: "mid_range",
    interests: ["nature", "wellness", "culture", "food"], must_have_interests: ["nature"],
    smoking: false, dietary: "vegan", solo_experience: "experienced", date_flexible: true, gender_preference: "female",
  },
  "vikram@test.com": {
    travel_pace: "moderate", planning_style: "flexible", accommodation_pref: "luxury",
    interests: ["culture", "history", "food", "shopping"], must_have_interests: null,
    smoking: false, dietary: "none", solo_experience: "experienced", date_flexible: false, gender_preference: "any",
  },
  "meera@test.com": {
    travel_pace: "slow", planning_style: "flexible", accommodation_pref: "budget",
    interests: ["culture", "food", "art", "photography"], must_have_interests: ["food", "culture"],
    smoking: false, dietary: "vegetarian", solo_experience: "none", date_flexible: true, gender_preference: "female",
  },
  "arjun@test.com": {
    travel_pace: "fast", planning_style: "spontaneous", accommodation_pref: "mid_range",
    interests: ["adventure", "nightlife", "street_food", "shopping"], must_have_interests: null,
    smoking: true, dietary: "none", solo_experience: "some", date_flexible: false, gender_preference: "any",
  },
};

const HELP_PROFILES = {
  "priya@test.com": { needs_help_with: ["local_guide", "translation"], can_help_with: ["food_recommendations"] },
  "rahul@test.com": { needs_help_with: [], can_help_with: ["accommodation", "transport", "local_guide"] },
  "anita@test.com": { needs_help_with: ["airport_pickup", "accommodation"], can_help_with: ["document_help", "translation"] },
  "vikram@test.com": { needs_help_with: [], can_help_with: ["airport_pickup", "local_guide", "translation", "accommodation", "transport"] },
  "meera@test.com": { needs_help_with: ["airport_pickup", "local_guide", "translation", "food_recommendations", "emergency_contact"], can_help_with: [] },
  "arjun@test.com": { needs_help_with: ["food_recommendations", "local_guide"], can_help_with: ["transport", "accommodation"] },
};

const PRIVACY = {
  "priya@test.com": { show_phone: false, show_email: true, show_full_name: true, discoverable: true },
  "rahul@test.com": { show_phone: true, show_email: true, show_full_name: true, discoverable: true },
  "anita@test.com": { show_phone: false, show_email: false, show_full_name: true, discoverable: true },
  "vikram@test.com": { show_phone: true, show_email: true, show_full_name: true, discoverable: true },
  "meera@test.com": { show_phone: false, show_email: true, show_full_name: true, discoverable: true },
  "arjun@test.com": { show_phone: false, show_email: true, show_full_name: true, discoverable: true },
};

async function main() {
  const userIds = {};

  // Step 0: Clean up any corrupted SQL-inserted test users
  console.log("Cleaning up old test users...");
  const oldIds = [
    "a1111111-1111-1111-1111-111111111111",
    "a2222222-2222-2222-2222-222222222222",
    "a3333333-3333-3333-3333-333333333333",
    "a4444444-4444-4444-4444-444444444444",
    "a5555555-5555-5555-5555-555555555555",
    "a6666666-6666-6666-6666-666666666666",
  ];
  for (const id of oldIds) {
    const { error } = await supabase.auth.admin.deleteUser(id);
    if (error && !error.message.includes("not found")) {
      console.log(`  Cleanup ${id}: ${error.message}`);
    }
  }

  // Also try to find and delete by email
  for (const u of TEST_USERS) {
    const { data: existing } = await supabase.auth.admin.listUsers();
    const found = existing?.users?.find((x) => x.email === u.email);
    if (found) {
      console.log(`  Deleting existing ${u.email} (${found.id})...`);
      await supabase.auth.admin.deleteUser(found.id);
    }
  }

  // Also clean via direct SQL as a fallback
  console.log("  Running SQL cleanup...");
  const testEmails = TEST_USERS.map(u => `'${u.email}'`).join(",");
  await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({}),
  }).catch(() => {});

  // Direct SQL cleanup via pg
  const sqlCleanup = `
    DELETE FROM auth.identities WHERE user_id IN (SELECT id FROM auth.users WHERE email IN (${testEmails}));
    DELETE FROM auth.users WHERE email IN (${testEmails});
    DELETE FROM auth.identities WHERE user_id IN (${oldIds.map(id => `'${id}'`).join(",")});
    DELETE FROM auth.users WHERE id IN (${oldIds.map(id => `'${id}'`).join(",")});
  `;
  // Execute via Supabase SQL endpoint
  const sqlRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ query: sqlCleanup }),
  }).catch(() => null);

  console.log("  Cleanup done, waiting 2s...");
  await new Promise(r => setTimeout(r, 2000));

  // Step 1: Create auth users via Admin API
  console.log("\nCreating auth users...");
  for (const u of TEST_USERS) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: u.meta,
    });
    if (error) {
      console.error(`  Failed to create ${u.email}:`, error.message);
      // Try listing to find if already created
      const { data: list } = await supabase.auth.admin.listUsers();
      const found = list?.users?.find((x) => x.email === u.email);
      if (found) {
        console.log(`  Found existing ${u.email} (${found.id})`);
        userIds[u.email] = found.id;
      }
      continue;
    }
    console.log(`  Created ${u.email} (${data.user.id})`);
    userIds[u.email] = data.user.id;
  }

  // Step 2: Upsert profiles
  console.log("\nUpserting profiles...");
  for (const [email, profile] of Object.entries(PROFILES)) {
    const uid = userIds[email];
    if (!uid) continue;
    const { error } = await supabase.from("profiles").upsert(
      { user_id: uid, ...profile, onboarded: true },
      { onConflict: "user_id" }
    );
    if (error) console.error(`  Profile ${email}:`, error.message);
    else console.log(`  ${email} profile OK`);
  }

  // Step 3: Insert trips
  console.log("\nInserting trips...");
  for (const [email, trips] of Object.entries(TRIPS)) {
    const uid = userIds[email];
    if (!uid) continue;
    // Delete existing trips for this user first
    await supabase.from("trips").delete().eq("user_id", uid);
    for (const trip of trips) {
      const { error } = await supabase.from("trips").insert({
        user_id: uid,
        ...trip,
        is_active: true,
      });
      if (error) console.error(`  Trip ${email} -> ${trip.dest_city}:`, error.message);
      else console.log(`  ${email}: ${trip.origin_city} -> ${trip.dest_city}`);
    }
  }

  // Step 4: Upsert travel preferences (table may not be in generated types)
  console.log("\nUpserting travel preferences...");
  for (const [email, prefs] of Object.entries(TRAVEL_PREFS)) {
    const uid = userIds[email];
    if (!uid) continue;
    // Use raw REST since table may not be in types
    const res = await fetch(`${SUPABASE_URL}/rest/v1/travel_preferences`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify({ user_id: uid, ...prefs }),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error(`  Prefs ${email}:`, text);
    } else {
      console.log(`  ${email} prefs OK`);
    }
  }

  // Step 5: Upsert help profiles
  console.log("\nUpserting help profiles...");
  for (const [email, help] of Object.entries(HELP_PROFILES)) {
    const uid = userIds[email];
    if (!uid) continue;
    const { error } = await supabase.from("help_profile").upsert(
      { user_id: uid, ...help, is_active: true },
      { onConflict: "user_id" }
    );
    if (error) console.error(`  Help ${email}:`, error.message);
    else console.log(`  ${email} help OK`);
  }

  // Step 6: Upsert privacy settings
  console.log("\nUpserting privacy settings...");
  for (const [email, priv] of Object.entries(PRIVACY)) {
    const uid = userIds[email];
    if (!uid) continue;
    const { error } = await supabase.from("privacy_settings").upsert(
      { user_id: uid, ...priv },
      { onConflict: "user_id" }
    );
    if (error) console.error(`  Privacy ${email}:`, error.message);
    else console.log(`  ${email} privacy OK`);
  }

  console.log("\n=== Done! ===");
  console.log("Test accounts (password: TestPass123!):");
  for (const [email, id] of Object.entries(userIds)) {
    console.log(`  ${email} -> ${id}`);
  }
}

main().catch(console.error);
