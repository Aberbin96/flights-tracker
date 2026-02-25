-- Add tail_number column to flights_history table
ALTER TABLE flights_history ADD COLUMN IF NOT EXISTS tail_number TEXT;

-- Create an index for faster lookups when cross-referencing next legs
CREATE INDEX IF NOT EXISTS idx_flights_history_tail_number ON flights_history (tail_number);

-- Comment on column
COMMENT ON COLUMN flights_history.tail_number IS 'Aircraft registration number (e.g., YV1234) used for next-leg validation';
