-- Create a view for airline delay statistics
create or replace view airline_delay_rankings as
select
  airline,
  count(*) as total_flights,
  count(*) filter (where delay_minutes > 15) as delayed_flights,
  avg(delay_minutes) as avg_delay_minutes,
  (count(*) filter (where delay_minutes <= 15)::float / count(*)) * 100 as on_time_percentage
from
  flights_history
group by
  airline
order by
  delayed_flights desc,
  avg_delay_minutes desc;

-- Optional: Grant access if not automatically covered by RLS (Views security can be tricky in Supabase depending on base table policies)
-- Since our base table allows read for all, the view should generally work for anon if it inherits permissions.
-- However, explicit grant is safer for views sometimes:
grant select on airline_delay_rankings to anon, authenticated, service_role;
