-- Drop existing views
DROP VIEW IF EXISTS daily_metrics_view;
DROP VIEW IF EXISTS airline_daily_performance_view;

-- Create updated detailed views
-- daily_metrics_view: now grouped by airline and arrival_iata to support sidebar filters
CREATE OR REPLACE VIEW daily_metrics_view AS
SELECT
  flight_date,
  origin,
  airline,
  arrival_iata,
  COUNT(*) as total_flights,
  COUNT(*) FILTER (WHERE status ILIKE 'cancelled') as cancelled_flights,
  COUNT(*) FILTER (WHERE delay_minutes > 15) as delayed_flights,
  COUNT(*) FILTER (WHERE status NOT ILIKE 'cancelled' AND delay_minutes <= 15) as on_time_flights
FROM flights_history
GROUP BY flight_date, origin, airline, arrival_iata;

-- airline_daily_performance_view: now grouped by origin and arrival_iata
CREATE OR REPLACE VIEW airline_daily_performance_view AS
SELECT
  flight_date,
  origin,
  airline,
  arrival_iata,
  COUNT(*) as total_flights,
  COUNT(*) FILTER (WHERE status NOT ILIKE 'cancelled' AND delay_minutes <= 15) as on_time_flights,
  COUNT(*) FILTER (WHERE delay_minutes > 15) as delayed_flights,
  COUNT(*) FILTER (WHERE status ILIKE 'cancelled') as cancelled_flights
FROM flights_history
GROUP BY flight_date, origin, airline, arrival_iata;

-- Grant permissions
GRANT SELECT ON daily_metrics_view TO anon, authenticated, service_role;
GRANT SELECT ON airline_daily_performance_view TO anon, authenticated, service_role;
