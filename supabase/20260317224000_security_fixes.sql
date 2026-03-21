-- Redefine views with SECURITY INVOKER to resolve Supabase Linter errors (0010_security_definer_view)
-- This ensures that the views respect the RLS policies of the underlying tables for the querying user.

-- 1. daily_metrics_view
DROP VIEW IF EXISTS public.daily_metrics_view;
CREATE OR REPLACE VIEW public.daily_metrics_view 
WITH (security_invoker = true)
AS
SELECT
  flight_date,
  origin,
  airline,
  arrival_iata,
  COUNT(*) as total_flights,
  COUNT(*) FILTER (WHERE status ILIKE 'cancelled') as cancelled_flights,
  COUNT(*) FILTER (WHERE status NOT ILIKE 'unknown' AND delay_minutes > 15) as delayed_flights,
  COUNT(*) FILTER (WHERE status NOT ILIKE 'cancelled' AND status NOT ILIKE 'unknown' AND delay_minutes <= 15) as on_time_flights
FROM flights_history
GROUP BY flight_date, origin, airline, arrival_iata;

-- 2. airline_daily_performance_view
DROP VIEW IF EXISTS public.airline_daily_performance_view;
CREATE OR REPLACE VIEW public.airline_daily_performance_view 
WITH (security_invoker = true)
AS
SELECT
  flight_date,
  origin,
  airline,
  arrival_iata,
  COUNT(*) FILTER (WHERE status NOT ILIKE 'unknown') as total_flights,
  COUNT(*) FILTER (WHERE status NOT ILIKE 'cancelled' AND status NOT ILIKE 'unknown' AND delay_minutes <= 15) as on_time_flights,
  COUNT(*) FILTER (WHERE status NOT ILIKE 'unknown' AND delay_minutes > 15) as delayed_flights,
  COUNT(*) FILTER (WHERE status ILIKE 'cancelled') as cancelled_flights
FROM flights_history
GROUP BY flight_date, origin, airline, arrival_iata;

-- 3. distinct_airlines_view
DROP VIEW IF EXISTS public.distinct_airlines_view;
CREATE OR REPLACE VIEW public.distinct_airlines_view 
WITH (security_invoker = true)
AS
SELECT DISTINCT airline 
FROM flights_history 
WHERE airline IS NOT NULL 
ORDER BY airline;

-- 4. distinct_airports_view
DROP VIEW IF EXISTS public.distinct_airports_view;
CREATE OR REPLACE VIEW public.distinct_airports_view 
WITH (security_invoker = true)
AS
SELECT DISTINCT origin 
FROM flights_history 
WHERE origin IS NOT NULL 
ORDER BY origin;

-- Grant permissions (though security_invoker = true means they'll need access to underlying tables too)
GRANT SELECT ON public.daily_metrics_view TO anon, authenticated, service_role;
GRANT SELECT ON public.airline_daily_performance_view TO anon, authenticated, service_role;
GRANT SELECT ON public.distinct_airlines_view TO anon, authenticated, service_role;
GRANT SELECT ON public.distinct_airports_view TO anon, authenticated, service_role;
