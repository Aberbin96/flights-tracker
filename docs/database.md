# Database Schema Documentation

This document describes the Supabase/PostgreSQL schema used in the Transparency Flights Tracker.

## Tables

### `flights_history`

The primary table storing all captured flight information.

| Column                    | Type          | Description                                                  |
| :------------------------ | :------------ | :----------------------------------------------------------- |
| `id`                      | `uuid`        | Primary Key (gen_random_uuid)                                |
| `flight_num`              | `text`        | IATA Flight number (e.g., V0 11)                             |
| `airline`                 | `text`        | Airline name                                                 |
| `origin`                  | `text`        | Origin airport IATA code (e.g., CCS)                         |
| `arrival_iata`            | `text`        | Destination airport IATA code                                |
| `status`                  | `text`        | Current status (e.g., Landed, Scheduled, Cancelled)          |
| `delay_minutes`           | `integer`     | Delay in minutes                                             |
| `flight_date`             | `date`        | Date of the flight                                           |
| `captured_at`             | `timestamptz` | When the record was first captured                           |
| `departure_scheduled`     | `timestamptz` | Scheduled departure time                                     |
| `departure_actual`        | `timestamptz` | Actual departure time                                        |
| `arrival_estimated`       | `timestamptz` | Estimated arrival time                                       |
| `arrival_actual`          | `timestamptz` | Actual arrival time                                          |
| `tail_number`             | `text`        | Aircraft registration (e.g., YV1234).                        |
| `icao24`                  | `text`        | Aircraft ICAO 24-bit Mode-S address (hex code).              |
| `enrichment_attempts`     | `integer`     | Count of failed aircraft enrichment attempts.                |
| `last_enrichment_attempt` | `timestamptz` | Timestamp of the last enrichment attempt.                    |
| `is_system_closed`        | `boolean`     | Flag set by cleanup logic if flight was closed automatically |

### `aircraft_cache`

Mapping of flight callsigns to known tail numbers to optimize API usage.

| Column        | Type          | Description                          |
| :------------ | :------------ | :----------------------------------- |
| `flight_iata` | `text`        | Primary Key (e.g., V011)             |
| `tail_number` | `text`        | Aircraft registration                |
| `last_seen`   | `timestamptz` | Last time this mapping was confirmed |
| `created_at`  | `timestamptz` | When the mapping was created         |

## Views

### `daily_metrics_view`

Summary of daily airport performance (total flights, cancellations, delays, punctuality).

### `airline_daily_performance_view`

Summary of daily airline performance (total flights, on-time, delayed, cancelled).

## Constraints

- **Unique Flight**: `flights_history_flight_num_flight_date_key` (Unique `flight_num` + `flight_date`)
