# Project Todo List

## Pending Tasks

### User Actions (Required)

- [x] **Test the API endpoint** `v1/flights` using `?airport=CCS` manually to verify data return.

### Backend Refinements (Sync & Data Quality)

- [ ] **Manual Sync Command**: Create a script/CLI command to manually sync a specific date range (for backfilling).

### Frontend Improvements

- [ ] **Donation Widgets**: Add "Buy Me a Coffee" or similar link with call-to-action.

### Advanced Research / Future Features

- [ ] **Airport Board Scraping**: Compare API data against scraped data from Maiquetía Airport digital board.

---

## Completed Tasks

### User Actions (Required)

- [x] **Register an Aviationstack account** and generate your `API_KEY`.
- [x] **Initialize a Supabase project** and get the connection URL and Anon Key.
- [x] **Configure Environment Variables** in the Vercel Dashboard (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `AVIATION_API_KEY`, `CRON_SECRET`).
- [x] **Deploy to Vercel** by connecting your GitHub repository.

### Backend & Database (Core)

- [x] **SQL Schema**: Create `flights_history` table (fields: `id`, `flight_num`, `airline`, `origin`, `status`, `delay_minutes`, `captured_at`).
- [x] **Setup**: Install `@supabase/supabase-js`, `axios`.
- [x] **Sync Script**: Develop `/api/sync` to fetch flight data and upsert into Supabase.
- [x] **Cron Security**: Implement Cron Secret Token check in API route.
- [x] **Cron Config**: Configure `vercel.json` for scheduled jobs.
- [x] **Data Aggregation**: Create SQL query/function for "Ranking of Most Delayed Airlines".
- [x] **Aggregation Views**: Create new views on database more helpful for the project (`daily_metrics_view` and `airline_daily_performance_view`).

### Frontend & Visualization (Core)

- [x] **Dashboard**: Build UI with Tailwind CSS for flight cards.
- [x] **Charts**: Integrate Recharts for cancellation trends.
- [x] **Refinements**: Dark mode, social sharing, specialized visualizations.
- [x] **Atomic Components**: Use atomic design to create the components (`Button`, `Icon`, `Badge`, etc.).
- [x] **Icon Cleanup**: Remove the text inside the icons, just show the icon.
- [x] **Top Bar Adjustments**: Okay, remove the coffee thing at the moment.

### Backend Refinements (Sync & Data Quality)

- [x] **Upsert Strategy**: Update synchronization logic to use a composite unique key (flight_iata + flight_date) to prevent duplicates.
- [x] **Error Logging**: Add better logging for failed syncs in Supabase + **Sentry integration**.
- [x] **More Airports**: Configure script to sync more airports beyond CCS.
- [x] **Hourly Polling**: Setup cron job for every 60 minutes to build historical data over time.
- [x] **GitHub Actions**: Create a github action to make the cron job, vercel isn't running the cron jobs for us.

### Data Sanitization & Logic (Anti-Ghosting)

- [x] **Stale Data Override**: Automatically mark active flights as 'landed' if 4+ hours past arrival time.
- [x] **Arrival Timestamp Logic**: Prioritize `arrival.actual` timestamp over status string for finalization.
- [x] **Manual Delay Calculation**: Calculate `delay_minutes` from scheduled vs actual departure times instead of API field.
- [x] **No-Show Validation**: Trigger status check if `actual_departure` is null and substantial time has passed.

### Frontend Improvements

- [x] **Translations (i18n)**: Support for English and Spanish using `next-intl`.
- [x] **Search & Filter**: Allow users to search by Flight Number or Airline.
- [x] **Date Picker**: Allow users to see historical data.
- [x] **Local Time Display**: Show current time in airport timezone, not server time.
- [x] **SEO & Metadata**: Add Open Graph tags for social sharing.
- [x] **About Page**: Explanation of project mission.
- [x] **Default Filters**: Fill the default airport to CCS and ensure default date is explicitly set in calendar.
- [x] **KPI Scopes**: Total Flights, Punctuality, Delays, Cancellations this values should be a summary of all records of this day.
- [x] **Airline Stats Scope**: Airline Performance should display the today performance, and total performance.
- [x] **Airline Stats Layout**: Modify Airline Performance to have a short version, currently have a lot of waste space.
- [x] **Fleet Activity Scope**: Fleet Activity is just for today flights.
- [x] **Detailed List Formatting**: Detailed Flight List should be the total flights in the table with a pagination.

### Advanced Research / Future Features

- [x] **Multi-Source Verification**: Integrate OpenSky Network or similar to cross-reference aircraft positions.
- [x] **Ghost Flight Heuristics**: Analyze ground speed/GPS updates to detect stalled/cancelled flights marked as active.
- [x] **Auto-Closure Indicator**: Visual indicator (Bot icon) for flights closed by system cleanup logic.
