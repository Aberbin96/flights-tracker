-- Migration to add arrival_iata column to flights_history table
ALTER TABLE flights_history ADD COLUMN IF NOT EXISTS arrival_iata text;

-- Add comment for documentation
COMMENT ON COLUMN flights_history.arrival_iata IS 'Destination airport IATA code';
