-- Add departure_scheduled column to flights_history table
ALTER TABLE flights_history ADD COLUMN IF NOT EXISTS departure_scheduled TIMESTAMPTZ;

-- Comment on column
COMMENT ON COLUMN flights_history.departure_scheduled IS 'Scheduled departure time from the API, used for no-show validation';
