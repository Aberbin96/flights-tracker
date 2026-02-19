# Project Todo List

## 👤 User Actions (Required)

These are tasks that require your external accounts, sensitive information, or manual verification.

- [x] **Register an Aviationstack account** and generate your `API_KEY`.
- [x] **Initialize a Supabase project** and get the connection URL and Anon Key.
- [x] **Configure Environment Variables** in the Vercel Dashboard (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `AVIATION_API_KEY`, `CRON_SECRET`).
- [ ] **Deploy to Vercel** by connecting your GitHub repository.
- [ ] **Test the API endpoint** `v1/flights` using `?airport=CCS` manually to verify data return.

## 🤖 AI / Engineering Tasks

These are tasks I can implement for you.

### Backend & Database (Core)

- [x] **SQL Schema**: Create `flights_history` table (fields: `id`, `flight_num`, `airline`, `origin`, `status`, `delay_minutes`, `captured_at`).
- [x] **Setup**: Install `@supabase/supabase-js`, `axios`.
- [x] **Sync Script**: Develop `/api/sync` to fetch flight data and upsert into Supabase.
- [x] **Cron Security**: Implement Cron Secret Token check in API route.
- [x] **Cron Config**: Configure `vercel.json` for scheduled jobs.
- [x] **Data Aggregation**: Create SQL query/function for "Ranking of Most Delayed Airlines".

### Frontend & Visualization (Core)

- [x] **Dashboard**: Build UI with Tailwind CSS for flight cards.
- [x] **Charts**: Integrate Recharts for cancellation trends.
- [x] **Refinements**: Dark mode, social sharing, specialized visualizations.

### Backend Refinements (Sync & Data Quality)

- [ ] **Sync Optimization**: Only fetch flights for the current day to save API credits and avoid future noise.
- [ ] **Manual Sync Command**: Create a script/CLI command to manually sync a specific date range (for backfilling).
- [ ] **Upsert Strategy**: Update synchronization logic to use a composite unique key (flight_iata + flight_date) to prevent duplicates.
- [ ] **Error Logging**: Add better logging for failed syncs in Supabase (maybe a `sync_logs` table) + Sentry.
- [ ] **More Airports**: Configure script to sync more airports beyond CCS.
- [ ] **Hourly Polling**: Setup cron job for every 60 minutes to build historical data over time.

### Data Sanitization & Logic (Anti-Ghosting)

- [ ] **Stale Data Override**: Automatically mark active flights as 'landed' if 4+ hours past arrival time.
- [ ] **Arrival Timestamp Logic**: Prioritize `arrival.actual` timestamp over status string for finalization.
- [ ] **Manual Delay Calculation**: Calculate `delay_minutes` from scheduled vs actual departure times instead of API field.
- [ ] **No-Show Validation**: Trigger status check if `actual_departure` is null and substantial time has passed.

### Frontend Improvements

- [ ] **Translations (i18n)**: Add English/Spanish toggle.
- [ ] **Search & Filter**: Allow users to search by Flight Number or Airline.
- [ ] **Date Picker**: Allow users to see historical data.
- [ ] **Local Time Display**: Show current time in airport timezone, not server time.
- [ ] **Mobile Design**: Optimize layout for mobile devices.
- [ ] **SEO & Metadata**: Add Open Graph tags for social sharing.
- [ ] **About Page**: Explanation of project mission.

### Advanced Research / Future Features

- [ ] **Multi-Source Verification**: Integrate OpenSky Network or similar to cross-reference aircraft positions.
- [ ] **Ghost Flight Heuristics**: Analyze ground speed/GPS updates to detect stalled/cancelled flights marked as active.
- [ ] **Airport Board Scraping**: Compare API data against scraped data from Maiquetía Airport digital board.

### RAW

Integrate Donation Widgets: Add "Buy Me a Coffee" or "PayPal" buttons with a customized call-to-action focused on infrastructure transparency.
