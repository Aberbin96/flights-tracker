-- Fix RLS warnings (0024_permissive_rls_policy and 0008_rls_enabled_no_policy)
-- This ensures that tables have appropriate policies and that write operations are restricted.

-- 1. Fix flights_history insert policy
-- The previous policy "Enable insert for service role only" was too permissive (WITH CHECK (true) for all roles).
DROP POLICY IF EXISTS "Enable insert for service role only" ON public.flights_history;
CREATE POLICY "Enable insert for service role only" 
ON public.flights_history 
FOR INSERT 
TO service_role 
WITH CHECK (true);

-- 2. Add policies for aircraft_cache
-- RLS was enabled but no policies existed, blocking all access.
DROP POLICY IF EXISTS "Enable read access for all users" ON public.aircraft_cache;
CREATE POLICY "Enable read access for all users" 
ON public.aircraft_cache 
FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Enable insert for service role only" ON public.aircraft_cache;
CREATE POLICY "Enable insert for service role only" 
ON public.aircraft_cache 
FOR INSERT 
TO service_role 
WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for service role only" ON public.aircraft_cache;
CREATE POLICY "Enable update for service role only" 
ON public.aircraft_cache 
FOR UPDATE 
TO service_role 
USING (true)
WITH CHECK (true);
