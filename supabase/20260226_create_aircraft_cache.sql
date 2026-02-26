-- Create aircraft_cache table to map flight callsigns/IATA to tail numbers
CREATE TABLE IF NOT EXISTS public.aircraft_cache (
    flight_iata TEXT PRIMARY KEY,
    tail_number TEXT NOT NULL,
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS (optional, depends on if frontend needs to read this, but for now it's server-side)
ALTER TABLE public.aircraft_cache ENABLE ROW LEVEL SECURITY;

-- Add comment
COMMENT ON TABLE public.aircraft_cache IS 'Cache of flight callsigns and their last known aircraft registration (tail number).';
