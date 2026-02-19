-- Create a view for daily cancellations over the last 30 days
create or replace view daily_cancellations as
select
  to_char(captured_at, 'YYYY-MM-DD') as day,
  count(*) as cancellations
from
  flights_history
where
  status = 'cancelled'
  and captured_at > now() - interval '30 days'
group by
  to_char(captured_at, 'YYYY-MM-DD')
order by
  day asc;

-- Grant access
grant select on daily_cancellations to anon, authenticated, service_role;
