
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE public.gender_type AS ENUM ('male', 'female', 'non_binary', 'prefer_not_to_say');
CREATE TYPE public.trip_role AS ENUM ('traveller', 'helper');
CREATE TYPE public.connection_status AS ENUM ('pending', 'accepted', 'blocked');

-- ============================================================
-- UTILITY: updated_at trigger function
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============================================================
-- TABLE: profiles
-- ============================================================
CREATE TABLE public.profiles (
  id           UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name    TEXT,
  display_name TEXT,
  avatar_url   TEXT,
  bio          TEXT,
  gender       gender_type,
  birth_year   SMALLINT,
  phone        TEXT,
  email        TEXT,
  languages    TEXT[] DEFAULT '{}',
  home_city    TEXT,
  home_country TEXT DEFAULT 'IN',
  karma_score  INTEGER NOT NULL DEFAULT 0,
  onboarded    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_public" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "profiles_delete_own" ON public.profiles
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- TABLE: privacy_settings
-- ============================================================
CREATE TABLE public.privacy_settings (
  id                    UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id               UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  show_phone            BOOLEAN NOT NULL DEFAULT FALSE,
  show_email            BOOLEAN NOT NULL DEFAULT FALSE,
  show_full_name        BOOLEAN NOT NULL DEFAULT TRUE,
  discoverable          BOOLEAN NOT NULL DEFAULT TRUE,
  contact_pref          TEXT NOT NULL DEFAULT 'app',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.privacy_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "privacy_select_own" ON public.privacy_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "privacy_insert_own" ON public.privacy_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "privacy_update_own" ON public.privacy_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_privacy_settings_updated_at
  BEFORE UPDATE ON public.privacy_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- TABLE: trips
-- ============================================================
CREATE TABLE public.trips (
  id              UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role            trip_role NOT NULL DEFAULT 'traveller',
  origin_city     TEXT NOT NULL,
  origin_country  TEXT NOT NULL DEFAULT 'IN',
  dest_city       TEXT NOT NULL,
  dest_country    TEXT NOT NULL DEFAULT 'IN',
  travel_date     DATE NOT NULL,
  return_date     DATE,
  notes           TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trips_select_public" ON public.trips
  FOR SELECT USING (true);

CREATE POLICY "trips_insert_own" ON public.trips
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "trips_update_own" ON public.trips
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "trips_delete_own" ON public.trips
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_trips_updated_at
  BEFORE UPDATE ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- TABLE: help_profile
-- ============================================================
CREATE TABLE public.help_profile (
  id              UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  needs_help_with TEXT[] DEFAULT '{}',
  can_help_with   TEXT[] DEFAULT '{}',
  experience_tags TEXT[] DEFAULT '{}',
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.help_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "help_profile_select_public" ON public.help_profile
  FOR SELECT USING (true);

CREATE POLICY "help_profile_insert_own" ON public.help_profile
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "help_profile_update_own" ON public.help_profile
  FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_help_profile_updated_at
  BEFORE UPDATE ON public.help_profile
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- TABLE: connections
-- ============================================================
CREATE TABLE public.connections (
  id          UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  addressee   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status      connection_status NOT NULL DEFAULT 'pending',
  message     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (requester, addressee)
);

ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "connections_select_participants" ON public.connections
  FOR SELECT USING (auth.uid() = requester OR auth.uid() = addressee);

CREATE POLICY "connections_insert_own" ON public.connections
  FOR INSERT WITH CHECK (auth.uid() = requester);

CREATE POLICY "connections_update_own" ON public.connections
  FOR UPDATE USING (auth.uid() = addressee OR auth.uid() = requester);

CREATE TRIGGER update_connections_updated_at
  BEFORE UPDATE ON public.connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- TABLE: messages
-- ============================================================
CREATE TABLE public.messages (
  id            UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  connection_id UUID NOT NULL REFERENCES public.connections(id) ON DELETE CASCADE,
  sender_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content       TEXT NOT NULL,
  read_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages_select_participants" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.connections c
      WHERE c.id = connection_id
        AND (c.requester = auth.uid() OR c.addressee = auth.uid())
    )
  );

CREATE POLICY "messages_insert_participants" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.connections c
      WHERE c.id = connection_id
        AND (c.requester = auth.uid() OR c.addressee = auth.uid())
        AND c.status = 'accepted'
    )
  );

-- ============================================================
-- TABLE: endorsements
-- ============================================================
CREATE TABLE public.endorsements (
  id           UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  giver_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tag          TEXT NOT NULL,
  note         TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (giver_id, receiver_id, tag)
);

ALTER TABLE public.endorsements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "endorsements_select_public" ON public.endorsements
  FOR SELECT USING (true);

CREATE POLICY "endorsements_insert_own" ON public.endorsements
  FOR INSERT WITH CHECK (auth.uid() = giver_id AND giver_id <> receiver_id);

-- ============================================================
-- TABLE: karma_log
-- ============================================================
CREATE TABLE public.karma_log (
  id          UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delta       SMALLINT NOT NULL,
  reason      TEXT NOT NULL,
  ref_id      UUID,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.karma_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "karma_log_select_own" ON public.karma_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "karma_log_insert_own" ON public.karma_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- FUNCTION + TRIGGER: auto-create profile on signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, phone)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.phone
  )
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.privacy_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- STORAGE: avatars bucket
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg','image/png','image/webp','image/gif'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "avatars_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "avatars_auth_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "avatars_auth_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "avatars_auth_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
