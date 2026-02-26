/**
 * Database table name constants
 */
export const DB_TABLES = {
  FLIGHTS_HISTORY: "flights_history",
  AIRCRAFT_CACHE: "aircraft_cache",
} as const;

/**
 * Database view name constants
 */
export const DB_VIEWS = {
  DAILY_METRICS: "daily_metrics_view",
  AIRLINE_PERFORMANCE: "airline_daily_performance_view",
} as const;
