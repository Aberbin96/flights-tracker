-- Add arrival_estimated column to flights_history table
ALTER TABLE flights_history ADD COLUMN IF NOT EXISTS arrival_estimated TIMESTAMPTZ;

-- Comment on column
COMMENT ON COLUMN flights_history.arrival_estimated IS 'Estimated arrival time from the API, used for stale data cleanup';
