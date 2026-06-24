-- ==========================================
-- BEKIND (KINDNESS REMINDER AGENT)
-- DDL SQL SCHEMA FOR SUPABASE
-- ==========================================

-- 1. Create Profiles Table (Linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  aura_points INTEGER DEFAULT 0,
  level TEXT DEFAULT 'Peka-Beginner',
  avatar_url TEXT,
  daily_streak INTEGER DEFAULT 0,
  last_streak_date DATE DEFAULT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create Profile RLS Policies
CREATE POLICY "Allow public read profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Allow users to update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Allow users to insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);


-- 2. Create Schedules Table (User calendar busy hours)
CREATE TABLE IF NOT EXISTS public.schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE DEFAULT auth.uid(),
  title TEXT NOT NULL,
  start_time TEXT NOT NULL, -- Format HH:MM (e.g. "08:00")
  end_time TEXT NOT NULL,   -- Format HH:MM (e.g. "10:30")
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS for Schedules
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

-- Create Schedules Policies
CREATE POLICY "Users can manage their own schedules" ON public.schedules
  FOR ALL USING (auth.uid() = user_id);

-- 3. Create Missions Table (Lightweight social tasks catalog)
CREATE TABLE IF NOT EXISTS public.missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL, -- e.g. "Hewan", "Lingkungan", "Sosial"
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  aura_points INTEGER DEFAULT 50,
  location_name TEXT NOT NULL,
  type TEXT DEFAULT 'system', -- 'system', 'personal', 'public'
  mode TEXT DEFAULT 'solo', -- 'solo', 'group', 'community'
  is_event_mission BOOLEAN DEFAULT false,
  event_name TEXT DEFAULT NULL,
  creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE DEFAULT NULL,
  payment_method TEXT DEFAULT NULL, -- 'qris', 'points'
  payment_status TEXT DEFAULT NULL, -- 'pending', 'paid'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS for Missions
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;

-- Create Missions Policies (Read-only for system and public, personal for own creator)
CREATE POLICY "Read public and system missions, plus own personal" ON public.missions
  FOR SELECT USING (type = 'system' OR type = 'public' OR creator_id = auth.uid());

CREATE POLICY "Allow authenticated manage missions" ON public.missions
  FOR ALL TO authenticated USING (creator_id = auth.uid() OR type = 'system' OR creator_id IS NULL);

-- Seed Initial Missions Data
INSERT INTO public.missions (title, description, category, latitude, longitude, aura_points, location_name)
VALUES
  -- Bandung Seeds
  ('Kasih Makan Kucing Jalanan', 'Ada beberapa kucing liar lucu di dekat taman yang kelihatan lapar. Kasih mereka cat food kering atau basah.', 'Hewan', -6.9024, 107.6186, 50, 'Taman Balai Kota'),
  ('Beli Jualan Pedagang Sepi', 'Beli minuman atau camilan ringan dari pedagang kaki lima tua di pinggir jalan untuk melariskan jualan mereka.', 'Sosial', -6.9015, 107.6200, 80, 'Jl. Riau (Depan FO)'),
  ('Bagi Air Minum ke Abang Ojol/Sapu Jalanan', 'Cuaca lagi panas banget. Beli es teh atau air mineral dingin, bagikan ke abang ojol atau penyapu jalanan yang sedang bertugas.', 'Kemanusiaan', -6.9038, 107.6155, 60, 'Pintu Gerbang Depan Unpad'),
  ('Pungut Sampah Plastik Liar', 'Pungut minimal 5 botol atau kantong plastik di sekitar trotoar dan buang ke tempat sampah terdekat biar lingkungan tetap bersih.', 'Lingkungan', -6.8995, 107.6198, 40, 'Sekitar Lapangan Saparua'),
  -- Jakarta Pusat Seeds
  ('Bagi Makanan di Monas', 'Beli beberapa botol air dingin dan roti, bagikan ke petugas kebersihan atau pengunjung yang kelelahan di sekitar Monas.', 'Sosial', -6.1754, 106.8272, 60, 'Monumen Nasional (Monas)'),
  ('Kasih Makan Kucing Liar Menteng', 'Ada beberapa kucing liar di sekitar Taman Suropati. Berikan makanan kucing basah atau kering ke mereka.', 'Hewan', -6.2008, 106.8326, 50, 'Taman Suropati Menteng'),
  ('Operasi Bersih Lapangan Banteng', 'Pungut sampah plastik/botol bekas yang berserakan di area jogging track Lapangan Banteng agar tetap bersih.', 'Lingkungan', -6.1706, 106.8344, 70, 'Lapangan Banteng'),
  ('Beli Cemilan Pedagang Keliling HI', 'Beli dagangan pedagang cilok/gerobak tua di sekitar area Bundaran HI untuk membantu melariskan jualan mereka.', 'Sosial', -6.1950, 106.8230, 80, 'Bundaran HI (Depan Grand Indonesia)')
ON CONFLICT DO NOTHING;

-- 4. Create Suggestions Table (Generated by Kindness Agent)
CREATE TABLE IF NOT EXISTS public.suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE DEFAULT auth.uid(),
  mission_id UUID REFERENCES public.missions(id) ON DELETE CASCADE NOT NULL,
  free_start_time TEXT NOT NULL,
  free_end_time TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, accepted, completed, declined
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS for Suggestions
ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;

-- Create Suggestions Policies
CREATE POLICY "Users can manage their own suggestions" ON public.suggestions
  FOR ALL USING (auth.uid() = user_id);

-- Enable Realtime for Suggestions Table (Crucial for Agent notifications)
alter publication supabase_realtime add table public.suggestions;

-- 5. Create Completed Missions Table (History logs with proof)
CREATE TABLE IF NOT EXISTS public.completed_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE DEFAULT auth.uid(),
  mission_id UUID REFERENCES public.missions(id) ON DELETE CASCADE NOT NULL,
  photo_url TEXT NOT NULL,
  points_gained INTEGER NOT NULL,
  status TEXT DEFAULT 'approved', -- 'pending', 'approved', 'disputed'
  report_reason TEXT DEFAULT NULL,
  reported_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS for Completed Missions
ALTER TABLE public.completed_missions ENABLE ROW LEVEL SECURITY;

-- Create Completed Missions Policies
CREATE POLICY "Users can view and manage completions" ON public.completed_missions
  FOR ALL USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM public.missions 
      WHERE missions.id = completed_missions.mission_id 
      AND missions.creator_id = auth.uid()
    )
  );

-- 6. Trigger to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, username, aura_points, level, avatar_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', 'Bestie Peka'),
    COALESCE(new.raw_user_meta_data->>'username', 'peka_' || substring(gen_random_uuid()::text from 1 for 6)),
    150,
    'Peka-Beginner',
    'https://api.dicebear.com/7.x/pixel-art/png?seed=' || new.id::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Alter tables to add new required columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS personal_streak INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_personal_streak_date DATE DEFAULT NULL;

ALTER TABLE public.schedules ADD COLUMN IF NOT EXISTS date TEXT DEFAULT NULL;
ALTER TABLE public.schedules ADD COLUMN IF NOT EXISTS frequency TEXT DEFAULT 'once';
ALTER TABLE public.schedules ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'busy';

ALTER TABLE public.missions ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'system';
ALTER TABLE public.missions ADD COLUMN IF NOT EXISTS mode TEXT DEFAULT 'solo';
ALTER TABLE public.missions ADD COLUMN IF NOT EXISTS is_event_mission BOOLEAN DEFAULT false;
ALTER TABLE public.missions ADD COLUMN IF NOT EXISTS event_name TEXT DEFAULT NULL;
ALTER TABLE public.missions ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE DEFAULT NULL;
ALTER TABLE public.missions ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT NULL;
ALTER TABLE public.missions ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT NULL;
