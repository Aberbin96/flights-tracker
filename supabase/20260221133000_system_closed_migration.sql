-- Migration to add 'is_system_closed' for the Heuristics Cleanup Engine
ALTER TABLE flights_history
ADD COLUMN is_system_closed BOOLEAN NOT NULL DEFAULT FALSE;
