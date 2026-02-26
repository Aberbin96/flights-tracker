-- Add enrichment tracking columns to flights_history
ALTER TABLE flights_history ADD COLUMN IF NOT EXISTS icao24 TEXT;
ALTER TABLE flights_history ADD COLUMN IF NOT EXISTS enrichment_attempts INTEGER DEFAULT 0;
ALTER TABLE flights_history ADD COLUMN IF NOT EXISTS last_enrichment_attempt TIMESTAMPTZ;

-- Index for efficient querying by enrichment status
CREATE INDEX IF NOT EXISTS idx_flights_history_enrichment_status 
ON flights_history (tail_number, enrichment_attempts, last_enrichment_attempt)
WHERE tail_number IS NULL;
