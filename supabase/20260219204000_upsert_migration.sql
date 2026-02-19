-- Add flight_date column to flights_history table if it doesn't exist
ALTER TABLE flights_history ADD COLUMN IF NOT EXISTS flight_date DATE;

-- Populate flight_date with captured_at date for existing records (this is a best-effort migration)
UPDATE flights_history SET flight_date = captured_at::DATE WHERE flight_date IS NULL;

-- Make flight_date mandatory for future records
ALTER TABLE flights_history ALTER COLUMN flight_date SET NOT NULL;

-- Remove duplicates *before* adding the unique constraint
-- We keep the most recent record (based on captured_at) for each (flight_num, flight_date) pair
DELETE FROM flights_history
WHERE id IN (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY flight_num, flight_date
             ORDER BY captured_at DESC
           ) as rn
    FROM flights_history
  ) t
  WHERE t.rn > 1
);

-- Create a unique constraint to prevent duplicate entries for the same flight on the same day
ALTER TABLE flights_history ADD CONSTRAINT flights_history_flight_num_flight_date_key UNIQUE (flight_num, flight_date);
