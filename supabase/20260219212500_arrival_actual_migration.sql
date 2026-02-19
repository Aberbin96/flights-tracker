-- Add arrival_actual column to flights_history table
ALTER TABLE flights_history ADD COLUMN IF NOT EXISTS arrival_actual TIMESTAMPTZ;

-- Comment on column
COMMENT ON COLUMN flights_history.arrival_actual IS 'Actual arrival time from the API, used to definitively mark flights as landed';
