-- ============================================================
-- TEST DATA SEED SCRIPT for YatraMitr matching algorithm
-- Run in Supabase SQL Editor
-- Creates 6 test users with profiles, trips, help_profiles,
-- travel_preferences, and privacy_settings
-- ============================================================

-- Generate fixed UUIDs for test users
DO $$
DECLARE
  u1 UUID := 'a1111111-1111-1111-1111-111111111111';
  u2 UUID := 'a2222222-2222-2222-2222-222222222222';
  u3 UUID := 'a3333333-3333-3333-3333-333333333333';
  u4 UUID := 'a4444444-4444-4444-4444-444444444444';
  u5 UUID := 'a5555555-5555-5555-5555-555555555555';
  u6 UUID := 'a6666666-6666-6666-6666-666666666666';
BEGIN

-- ============================================================
-- 1. Create auth users (password: TestPass123!)
-- ============================================================
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, role, aud, created_at, updated_at)
VALUES
  (u1, '00000000-0000-0000-0000-000000000000', 'priya@test.com',   crypt('TestPass123!', gen_salt('bf')), now(), '{"full_name":"Priya Sharma"}'::jsonb,   'authenticated', 'authenticated', now(), now()),
  (u2, '00000000-0000-0000-0000-000000000000', 'rahul@test.com',   crypt('TestPass123!', gen_salt('bf')), now(), '{"full_name":"Rahul Patel"}'::jsonb,    'authenticated', 'authenticated', now(), now()),
  (u3, '00000000-0000-0000-0000-000000000000', 'anita@test.com',   crypt('TestPass123!', gen_salt('bf')), now(), '{"full_name":"Anita Desai"}'::jsonb,    'authenticated', 'authenticated', now(), now()),
  (u4, '00000000-0000-0000-0000-000000000000', 'vikram@test.com',  crypt('TestPass123!', gen_salt('bf')), now(), '{"full_name":"Vikram Singh"}'::jsonb,   'authenticated', 'authenticated', now(), now()),
  (u5, '00000000-0000-0000-0000-000000000000', 'meera@test.com',   crypt('TestPass123!', gen_salt('bf')), now(), '{"full_name":"Meera Krishnan"}'::jsonb, 'authenticated', 'authenticated', now(), now()),
  (u6, '00000000-0000-0000-0000-000000000000', 'arjun@test.com',   crypt('TestPass123!', gen_salt('bf')), now(), '{"full_name":"Arjun Reddy"}'::jsonb,   'authenticated', 'authenticated', now(), now())
ON CONFLICT (id) DO NOTHING;

-- Also insert into auth.identities (required for email login)
INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
VALUES
  (u1, u1, u1, 'email', jsonb_build_object('sub', u1, 'email', 'priya@test.com'),  now(), now(), now()),
  (u2, u2, u2, 'email', jsonb_build_object('sub', u2, 'email', 'rahul@test.com'),  now(), now(), now()),
  (u3, u3, u3, 'email', jsonb_build_object('sub', u3, 'email', 'anita@test.com'),  now(), now(), now()),
  (u4, u4, u4, 'email', jsonb_build_object('sub', u4, 'email', 'vikram@test.com'), now(), now(), now()),
  (u5, u5, u5, 'email', jsonb_build_object('sub', u5, 'email', 'meera@test.com'),  now(), now(), now()),
  (u6, u6, u6, 'email', jsonb_build_object('sub', u6, 'email', 'arjun@test.com'),  now(), now(), now())
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. Profiles
-- ============================================================
-- Note: profiles may auto-create via trigger. Use upsert pattern.
INSERT INTO public.profiles (user_id, full_name, display_name, bio, gender, birth_year, languages, home_city, home_country, onboarded)
VALUES
  (u1, 'Priya Sharma',    'Priya',   'Solo traveller exploring Europe. Love history and street food!',
   'female', 1995, ARRAY['English','Hindi','Tamil'], 'DEL', 'IN', true),

  (u2, 'Rahul Patel',     'Rahul',   'Backpacker and photographer. Always up for an adventure.',
   'male',   1992, ARRAY['English','Hindi','Gujarati'], 'BOM', 'IN', true),

  (u3, 'Anita Desai',     'Anita',   'Digital nomad working remotely. Seeking travel buddies for Southeast Asia.',
   'female', 1990, ARRAY['English','Hindi'], 'BLR', 'IN', true),

  (u4, 'Vikram Singh',    'Vikram',  'Frequent flyer between India and UK. Happy to help first-time travellers.',
   'male',   1988, ARRAY['English','Hindi','Punjabi'], 'LHR', 'GB', true),

  (u5, 'Meera Krishnan',  'Meera',   'Art lover and foodie. Planning my first solo trip to Japan!',
   'female', 1997, ARRAY['English','Malayalam','Hindi'], 'COK', 'IN', true),

  (u6, 'Arjun Reddy',     'Arjun',   'Tech worker in Dubai. Weekend explorer around the Middle East.',
   'male',   1993, ARRAY['English','Hindi','Telugu'], 'DXB', 'AE', true)
ON CONFLICT (user_id) DO UPDATE SET
  full_name = EXCLUDED.full_name, display_name = EXCLUDED.display_name,
  bio = EXCLUDED.bio, gender = EXCLUDED.gender, birth_year = EXCLUDED.birth_year,
  languages = EXCLUDED.languages, home_city = EXCLUDED.home_city,
  home_country = EXCLUDED.home_country, onboarded = EXCLUDED.onboarded;

-- ============================================================
-- 3. Trips (various overlapping dates for match testing)
-- ============================================================
INSERT INTO public.trips (user_id, role, origin_city, dest_city, dest_country, travel_date, return_date, is_active)
VALUES
  -- Priya: Delhi -> Paris, late March (traveller)
  (u1, 'traveller', 'DEL', 'CDG', 'FR', '2026-03-25', '2026-04-05', true),
  -- Priya also has a future Japan trip
  (u1, 'traveller', 'DEL', 'NRT', 'JP', '2026-05-10', '2026-05-20', true),

  -- Rahul: Mumbai -> Paris, overlapping with Priya (traveller)
  (u2, 'traveller', 'BOM', 'CDG', 'FR', '2026-03-28', '2026-04-08', true),

  -- Anita: Bangalore -> Bangkok (traveller)
  (u3, 'traveller', 'BLR', 'BKK', 'TH', '2026-04-01', '2026-04-15', true),
  -- Anita also going to Tokyo, overlapping with Priya's Japan trip
  (u3, 'traveller', 'BLR', 'NRT', 'JP', '2026-05-12', '2026-05-22', true),

  -- Vikram: London -> Delhi, helper role
  (u4, 'helper', 'LHR', 'DEL', 'IN', '2026-03-20', '2026-04-10', true),
  -- Vikram also offering help in Paris
  (u4, 'helper', 'LHR', 'CDG', 'FR', '2026-03-30', '2026-04-05', true),

  -- Meera: Kochi -> Tokyo, overlapping with Priya and Anita
  (u5, 'traveller', 'COK', 'NRT', 'JP', '2026-05-08', '2026-05-18', true),

  -- Arjun: Dubai -> Bangkok, overlapping with Anita
  (u6, 'traveller', 'DXB', 'BKK', 'TH', '2026-04-03', '2026-04-12', true);

-- ============================================================
-- 4. Travel Preferences
-- ============================================================
INSERT INTO public.travel_preferences (user_id, travel_pace, planning_style, accommodation_pref, interests, must_have_interests, smoking, dietary, solo_experience, date_flexible, gender_preference)
VALUES
  -- Priya: moderate pace, flexible planner, mid-range, loves culture & food
  (u1, 'moderate', 'flexible', 'mid_range',
   ARRAY['culture','food','history','photography'], ARRAY['culture'], false, 'vegetarian', 'some', true, 'any'),

  -- Rahul: fast pace, spontaneous, budget, adventure & nightlife
  (u2, 'fast', 'spontaneous', 'budget',
   ARRAY['adventure','nightlife','photography','street_food'], NULL, false, 'none', 'experienced', false, 'any'),

  -- Anita: slow pace, structured, mid-range, nature & wellness
  (u3, 'slow', 'structured', 'mid_range',
   ARRAY['nature','wellness','culture','food'], ARRAY['nature'], false, 'vegan', 'experienced', true, 'female'),

  -- Vikram: moderate, flexible, luxury, business & culture
  (u4, 'moderate', 'flexible', 'luxury',
   ARRAY['culture','history','food','shopping'], NULL, false, 'none', 'experienced', false, 'any'),

  -- Meera: slow pace, flexible, budget, art & food (first-timer)
  (u5, 'slow', 'flexible', 'budget',
   ARRAY['culture','food','art','photography'], ARRAY['food','culture'], false, 'vegetarian', 'none', true, 'female'),

  -- Arjun: fast pace, spontaneous, mid-range, adventure & nightlife
  (u6, 'fast', 'spontaneous', 'mid_range',
   ARRAY['adventure','nightlife','street_food','shopping'], NULL, true, 'none', 'some', false, 'any')
ON CONFLICT ON CONSTRAINT travel_preferences_user_unique DO UPDATE SET
  travel_pace = EXCLUDED.travel_pace, planning_style = EXCLUDED.planning_style,
  accommodation_pref = EXCLUDED.accommodation_pref, interests = EXCLUDED.interests,
  must_have_interests = EXCLUDED.must_have_interests, smoking = EXCLUDED.smoking,
  dietary = EXCLUDED.dietary, solo_experience = EXCLUDED.solo_experience,
  date_flexible = EXCLUDED.date_flexible, gender_preference = EXCLUDED.gender_preference;

-- ============================================================
-- 5. Help Profiles
-- ============================================================
INSERT INTO public.help_profile (user_id, needs_help_with, can_help_with, is_active)
VALUES
  -- Priya: needs local guide & translation, can help with food recs
  (u1, ARRAY['local_guide','translation'], ARRAY['food_recommendations'], true),

  -- Rahul: experienced, can help with accommodation & transport
  (u2, ARRAY[]::text[], ARRAY['accommodation','transport','local_guide'], true),

  -- Anita: needs airport pickup, can help with document help
  (u3, ARRAY['airport_pickup','accommodation'], ARRAY['document_help','translation'], true),

  -- Vikram: helper role, can help with everything
  (u4, ARRAY[]::text[], ARRAY['airport_pickup','local_guide','translation','accommodation','transport'], true),

  -- Meera: first-timer, needs lots of help
  (u5, ARRAY['airport_pickup','local_guide','translation','food_recommendations','emergency_contact'], ARRAY[]::text[], true),

  -- Arjun: needs food recs, can help with transport
  (u6, ARRAY['food_recommendations','local_guide'], ARRAY['transport','accommodation'], true)
ON CONFLICT (user_id) DO UPDATE SET
  needs_help_with = EXCLUDED.needs_help_with,
  can_help_with = EXCLUDED.can_help_with,
  is_active = EXCLUDED.is_active;

-- ============================================================
-- 6. Privacy Settings
-- ============================================================
INSERT INTO public.privacy_settings (user_id, show_phone, show_email, show_full_name, discoverable)
VALUES
  (u1, false, true,  true, true),
  (u2, true,  true,  true, true),
  (u3, false, false, true, true),
  (u4, true,  true,  true, true),
  (u5, false, true,  true, true),
  (u6, false, true,  true, true)
ON CONFLICT (user_id) DO UPDATE SET
  show_phone = EXCLUDED.show_phone, show_email = EXCLUDED.show_email,
  show_full_name = EXCLUDED.show_full_name, discoverable = EXCLUDED.discoverable;

END $$;

-- ============================================================
-- EXPECTED MATCHING SCENARIOS:
-- ============================================================
-- Login as Priya (priya@test.com / TestPass123!):
--   - Rahul: HIGH match (same dest CDG, overlapping dates, shared photography interest)
--   - Vikram: MEDIUM-HIGH (helper in CDG, overlapping dates, shared culture/history/food)
--   - Anita: MEDIUM (different dest but both going to NRT in May, shared culture/food)
--   - Meera: MEDIUM (both going to NRT in May, shared culture/food/photography, both vegetarian)
--   - Arjun: LOW (different dest, different interests, smoker)
--
-- Login as Meera (meera@test.com / TestPass123!):
--   - Priya: HIGH (same NRT dest, overlapping dates, shared interests, both vegetarian)
--   - Anita: MEDIUM-HIGH (both going to NRT, shared culture/food)
--   - Vikram: LOW-MEDIUM (helper but different dest)
--   - Rahul: LOW (different dest, different style)
--   - Arjun: LOW (different everything)
-- ============================================================
