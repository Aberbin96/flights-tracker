# Real Historical Data Acquisition Strategies

To populate the tracker with **real** historical data, we need reliable sources that provide information on flight schedules, actual departure/arrival times, and flight numbers for past dates.

## 1. Aviationstack API (Paid Plan)

The current service we use supports historical data if you upgrade to the **Basic** plan ($29/mo) or higher.

- **How to use**: We can modify our `api/sync` route to accept a `date` parameter.
- **Implementation**: A simple loop script that calls `api/sync?date=YYYY-MM-DD` for each day in the past month.
- **Pros**: Matches our current data structure perfectly. Zero integration effort.

## 2. OpenSky Network (Historical Database)

OpenSky provides a historical database through their "Impala" shell for research purposes.

- **How to use**: Write a Python/Java script to query their database for aircraft that departed from Venezuelan airports on specific dates.
- **Challenge**: Their data consists of "state vectors" (raw positions). We would need to heuristically group these vectors into "flights" and guess the IATA flight numbers by matching callsigns with airline schedules.
- **Pros**: Free for academics and some personal projects.

## 3. ADS-B Exchange (Commercial Access)

One of the most comprehensive sources for raw ADS-B data.

- **Pros**: Extremely accurate.
- **Cons**: Very expensive for commercial use. Might be overkill for this project.

## 4. Manual CSV Import Utility (Enthusiast Exports)

Many aviation enthusiasts use tools like **Virtual Radar Server** or **FlightRadar24 Gold** which allow exporting historical data to CSV.

- **Strategy**: I can create a `/scripts/import_csv.ts` utility.
- **Workflow**: You find a CSV from a local spotter or enthusiast group, run the script, and the dashboard fills up.

## 5. Scripted "Retro-active" Sync

If we assume the Aviationstack API provides data for the "last 24 hours" even on the free tier (sometimes they do for recent arrivals), we could run a script that fetches data for specifically "yesterday" using the `flight_date` parameter.

---

### Recommended Next Step

I recommend implementing the **Backfill API Support**. Even if you don't have the paid key yet, the code will be ready for whenever you decide to backfill a specific date.

Would you like me to:

1.  **Enable the `date` parameter** in the sync API?
2.  **Create a CSV import script** so you can upload your own data?
