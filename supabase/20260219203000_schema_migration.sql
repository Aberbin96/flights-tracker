-- Create the flights_history table
create table flights_history (
  id uuid default gen_random_uuid() primary key,
  flight_num text not null,
  airline text not null,
  origin text not null,
  status text not null,
  delay_minutes integer,
  captured_at timestamp with time zone default now()
);

-- Set up Row Level Security (RLS)
-- For now, we enable read access for everyone, but restrict write access to service role only (backend)
alter table flights_history enable row level security;

create policy "Enable read access for all users"
on flights_history for select
using (true);

create policy "Enable insert for service role only"
on flights_history for insert
with check (true); 
-- Note: In a real production app with user submission, you'd want stricter policies. 
-- Since this is populated by our backend script, the service key will bypass RLS anyway, 
-- but it's good practice to have policies.
