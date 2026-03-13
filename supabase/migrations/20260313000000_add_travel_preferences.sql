-- Travel preferences table for matching algorithm
-- Stores extended profile data: budget, style, interests, etc.

CREATE TABLE IF NOT EXISTS public.travel_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Travel style
  travel_pace TEXT CHECK (travel_pace IN ('slow', 'moderate', 'fast')),
  planning_style TEXT CHECK (planning_style IN ('spontaneous', 'flexible', 'structured')),
  accommodation_pref TEXT CHECK (accommodation_pref IN ('budget', 'mid_range', 'luxury')),

  -- Interests
  interests TEXT[] DEFAULT '{}',
  must_have_interests TEXT[] DEFAULT '{}',

  -- Personal preferences
  smoking BOOLEAN DEFAULT false,
  dietary TEXT CHECK (dietary IN ('none', 'vegetarian', 'vegan', 'halal', 'kosher')) DEFAULT 'none',
  solo_experience TEXT CHECK (solo_experience IN ('none', 'some', 'experienced')) DEFAULT 'none',

  -- Matching preferences
  date_flexible BOOLEAN DEFAULT false,
  gender_preference TEXT CHECK (gender_preference IN ('any', 'same', 'male', 'female')) DEFAULT 'any',

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT travel_preferences_user_unique UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE public.travel_preferences ENABLE ROW LEVEL SECURITY;

-- Users can read all travel preferences (needed for matching)
CREATE POLICY "travel_preferences_select" ON public.travel_preferences
  FOR SELECT USING (true);

-- Users can insert their own
CREATE POLICY "travel_preferences_insert" ON public.travel_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own
CREATE POLICY "travel_preferences_update" ON public.travel_preferences
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Auto-update timestamp
CREATE TRIGGER travel_preferences_updated
  BEFORE UPDATE ON public.travel_preferences
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Also add return_date to trips if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'trips' AND column_name = 'return_date'
  ) THEN
    ALTER TABLE public.trips ADD COLUMN return_date DATE;
  END IF;
END $$;
