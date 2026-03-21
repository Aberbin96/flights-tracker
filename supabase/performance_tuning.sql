-- Performance Tuning for Transparency Flights Tracker
-- Run these commands in the Supabase SQL Editor to optimize query performance.

-- Index for filtering by flight date (Home page default)
CREATE INDEX IF NOT EXISTS idx_flights_date ON public.flights_history (flight_date DESC);

-- Index for filtering by origin airport (Sidebar filter)
CREATE INDEX IF NOT EXISTS idx_flights_origin ON public.flights_history (origin);

-- Index for filtering by airline (Sidebar filter)
CREATE INDEX IF NOT EXISTS idx_flights_airline ON public.flights_history (airline);

-- Index for filtering by destination (Domestic vs International heuristic)
CREATE INDEX IF NOT EXISTS idx_flights_arrival ON public.flights_history (arrival_iata);

-- Composite index for the most common dashboard query (Date + Origin)
CREATE INDEX IF NOT EXISTS idx_flights_date_origin ON public.flights_history (flight_date DESC, origin);

-- Partial index for pending enrichment (Used by /api/enrich-aircraft)
CREATE INDEX IF NOT EXISTS idx_flights_pending_enrichment 
ON public.flights_history (enrichment_attempts) 
WHERE tail_number IS NULL AND icao24 IS NOT NULL;

-- Index for tail_number lookups (Used by resolveStuckFlights)
CREATE INDEX IF NOT EXISTS idx_flights_tail_number ON public.flights_history (tail_number);
