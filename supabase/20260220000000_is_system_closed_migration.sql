-- Add is_system_closed column to flights_history
ALTER TABLE flights_history 
ADD COLUMN IF NOT EXISTS is_system_closed BOOLEAN DEFAULT FALSE;

-- Comment on column
COMMENT ON COLUMN flights_history.is_system_closed IS 'Flag indicating if the flight status was updated by the system cleanup logic (ghost/stale) rather than official API data.';
