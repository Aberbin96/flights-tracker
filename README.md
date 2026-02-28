# Transparency Flights Tracker ✈️

A modern web application for tracking and analyzing flight delays and cancellations at key airports (primarily CCS - Caracas). This project aims to provide transparency into airline performance through automated data synchronization and advanced aircraft enrichment.

## Key Features

- **Automated Flight Synchronization**: Multi-source data fetching from AviationStack and AeroDataBox.
- **Aircraft Enrichment**: Automated resolution of aircraft registration (tail numbers) via Hexdb.io and OpenSky Network cross-referencing.
- **Intelligent Status Resolution**: Heuristics to resolve "Unknown" or stuck flights based on actual arrival/departure times and next-leg activity.
- **Advanced Filtering**: Filter by Date, Airline, Flight Type (Domestic/International), and Company Type (Commercial, Cargo, Private, Public).
- **Internationalization**: Full support for English and Spanish (via `next-intl`).
- **Modern UI**: Dark mode, responsive design, and atomic component architecture.

## Tech Stack

- **Frontend**: Next.js 15 (App Router), Tailwind CSS, Framer Motion.
- **Backend**: Supabase (PostgreSQL, Edge Functions), Axiom (Logging).
- **APIs**: AviationStack, AeroDataBox (via RapidAPI), Hexdb.io, OpenSky Network.
- **Monitoring**: Sentry Integration.

## Getting Started

### Prerequisites

- Node.js 20+
- Supabase Account
- API Keys for AviationStack and AeroDataBox

### Installation

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure environment variables in `.env.local`:
    - `NEXT_PUBLIC_SUPABASE_URL`
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    - `SUPABASE_SERVICE_ROLE_KEY`
    - `AVIATION_API_KEY`
    - `AERODATABOX_API_KEY`
    - `CRON_SECRET`
4.  Run the development server:
    ```bash
    npm run dev
    ```

## Documentation

- [Database Schema](docs/database.md)
- [Project Todo List](docs/todo.md)

## License

MIT
