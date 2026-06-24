-- Migration: Add Admin Role and RLS Policies for Missions

-- 1. Add 'role' column to profiles if it doesn't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- 2. Drop existing policies on missions to apply new strict Admin rules
DROP POLICY IF EXISTS "Allow authenticated manage missions" ON public.missions;
DROP POLICY IF EXISTS "Read public and system missions, plus own personal" ON public.missions;

-- 3. New Mission Policies (Admin CUD, All Read)
-- All authenticated and public users can read missions
CREATE POLICY "Anyone can read missions" ON public.missions
  FOR SELECT USING (true);

-- Only users with 'admin' role can insert missions
CREATE POLICY "Admin can insert missions" ON public.missions
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Only users with 'admin' role can update missions
CREATE POLICY "Admin can update missions" ON public.missions
  FOR UPDATE TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Only users with 'admin' role can delete missions
CREATE POLICY "Admin can delete missions" ON public.missions
  FOR DELETE TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );
