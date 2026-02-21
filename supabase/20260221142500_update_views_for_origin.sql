-- Drop the old view
DROP VIEW IF EXISTS airline_daily_performance_view;

-- Recreate with origin parameter to allow Sidebar filtering
CREATE OR REPLACE VIEW airline_daily_performance_view AS
SELECT
  flight_date,
  origin,
  airline,
  COUNT(*) as total_flights,
  COUNT(*) FILTER (WHERE status NOT ILIKE 'cancelled' AND delay_minutes <= 15) as on_time_flights,
  COUNT(*) FILTER (WHERE delay_minutes > 15) as delayed_flights,
  COUNT(*) FILTER (WHERE status ILIKE 'cancelled') as cancelled_flights,
  CASE 
    WHEN COUNT(*) > 0 THEN 
      (COUNT(*) FILTER (WHERE status NOT ILIKE 'cancelled' AND delay_minutes <= 15)::numeric / COUNT(*)) * 100 
    ELSE 0 
  END as on_time_percentage
FROM flights_history
GROUP BY flight_date, origin, airline;

GRANT SELECT ON airline_daily_performance_view TO anon, authenticated, service_role;
