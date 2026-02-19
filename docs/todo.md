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

### Backend & Database

- [x] **SQL Schema**: Create `flights_history` table (fields: `id`, `flight_num`, `airline`, `origin`, `status`, `delay_minutes`, `captured_at`).
- [x] **Setup**: Install `@supabase/supabase-js`, `axios`.
- [x] **Sync Script**: Develop `/api/sync` to fetch flight data and upsert into Supabase.
- [x] **Cron Security**: Implement Cron Secret Token check in API route.
- [x] **Cron Config**: Configure `vercel.json` for scheduled jobs.
- [x] **Data Aggregation**: Create SQL query/function for "Ranking of Most Delayed Airlines".

### Frontend & Visualization

- [x] **Dashboard**: Build UI with Tailwind CSS for flight cards.
- [x] **Charts**: Integrate Recharts for cancellation trends.
- [x] **Refinements**: Dark mode, social sharing, specialized visualizations.

### Backend & Sync Refinements

- [ ] **Sync Optimization**: Only fetch flights for the current day to save API credits and avoid future noise.
- [ ] **Manual Sync Command**: Create a script/CLI command to manually sync a specific date range (for backfilling).
- [ ] **Error Logging**: Add better logging for failed syncs in Supabase (maybe a `sync_logs` table).
- [ ] **Sentry**: Add Sentry for error tracking.

### Frontend Improvements

- [ ] **Translations (i18n)**: Add English/Spanish toggle.
- [ ] **Search & Filter**: Allow users to search by Flight Number or Airline on the dashboard.
- [ ] **Date Picker**: Allow users to see historical data, not just "Recent".
- [ ] **SEO & Metadata**: Add Open Graph tags so links look good on Twitter/WhatsApp.
- [ ] **About Page**: A simple page explaining _why_ this project exists.
- [ ] **Mobile Design**: Improve mobile design.
