import { FlightRecord } from "@/types/flight";
import { IFlightProvider } from "./types";
import { supabaseAdmin } from "@/utils/supabase/admin";
import * as Sentry from "@sentry/nextjs";
import axios from "axios";

export class FlightService {
  private providers: IFlightProvider[];

  constructor(providers: IFlightProvider[]) {
    this.providers = providers;
  }

  async syncAirport(
    iata: string,
  ): Promise<{ 
    success: boolean; 
    count: number; 
    providersUsed: string[]; 
    failedProviders?: Record<string, string> 
  }> {
    let allRecords: FlightRecord[] = [];
    const providersUsed: string[] = [];
    const failedProviders: Record<string, string> = {};

    for (const provider of this.providers) {
      try {
        console.log(
          `[FlightService] Fetching ${iata} from ${provider.name}...`,
        );
        const records = await provider.fetchFlightsByAirport(iata);

        if (records.length > 0) {
          // Enrich each record if tail_number is missing
          const enrichedRecords = await Promise.all(
            records.map((r) => this.enrichFlightData(r)),
          );
          allRecords = [...allRecords, ...enrichedRecords];
          providersUsed.push(provider.name);
        }
      } catch (error: unknown) {
        let errorMsg = "Unknown error";
        let isRateLimit = false;

        if (axios.isAxiosError(error)) {
          isRateLimit = error.response?.status === 429 || error.message?.includes("rate limit");
          errorMsg = error.response?.data?.error?.message || error.response?.data?.message || error.message;
          
          if (error.response?.status === 401 || error.response?.status === 403) {
            errorMsg = `Auth/Credit issue: ${errorMsg}`;
          }
        } else if (error instanceof Error) {
          errorMsg = error.message;
        }

        console.warn(
          `[FlightService] Provider ${provider.name} ${isRateLimit ? "rate limited" : "failed"} for ${iata}: ${errorMsg}`,
        );

        failedProviders[provider.name] = errorMsg;

        if (!isRateLimit) {
          Sentry.captureException(error);
        }
      }
    }

    if (allRecords.length === 0) {
      return { success: false, count: 0, providersUsed, failedProviders };
    }

    // Deduplicate
    const uniqueRecordsMap = new Map<string, FlightRecord>();
    allRecords.forEach((record) => {
      const key = `${record.flight_num}-${record.flight_date}`;
      uniqueRecordsMap.set(key, record);
    });
    const uniqueRecords = Array.from(uniqueRecordsMap.values());

    // Upsert to Supabase
    const { error } = await supabaseAdmin
      .from("flights_history")
      .upsert(uniqueRecords, { onConflict: "flight_num, flight_date" });

    if (error) {
      console.error(
        `[FlightService] Supabase upsert failed for ${iata}:`,
        error,
      );
      throw error;
    }

    return {
      success: true,
      count: uniqueRecords.length,
      providersUsed,
      failedProviders: Object.keys(failedProviders).length > 0 ? failedProviders : undefined
    };
  }

  async syncByFlightNumber(
    flightNum: string,
  ): Promise<{ success: boolean; count: number; providersUsed: string[] }> {
    let allRecords: FlightRecord[] = [];
    const providersUsed: string[] = [];

    for (const provider of this.providers) {
      try {
        console.log(
          `[FlightService] Fetching ${flightNum} from ${provider.name}...`,
        );
        const records = await provider.fetchFlightsByNumber(flightNum);

        if (records.length > 0) {
          const enrichedRecords = await Promise.all(
            records.map((r) => this.enrichFlightData(r)),
          );
          allRecords = [...allRecords, ...enrichedRecords];
          providersUsed.push(provider.name);
        }
      } catch (error) {
        console.error(
          `[FlightService] Provider ${provider.name} failed for ${flightNum}:`,
          error,
        );
        Sentry.captureException(error);
      }
    }

    if (allRecords.length === 0) {
      return { success: false, count: 0, providersUsed };
    }

    // Deduplicate
    const uniqueRecordsMap = new Map<string, FlightRecord>();
    allRecords.forEach((record) => {
      const key = `${record.flight_num}-${record.flight_date}`;
      uniqueRecordsMap.set(key, record);
    });
    const uniqueRecords = Array.from(uniqueRecordsMap.values());

    // Upsert to Supabase
    const { error } = await supabaseAdmin
      .from("flights_history")
      .upsert(uniqueRecords, { onConflict: "flight_num, flight_date" });

    if (error) {
      console.error(
        `[FlightService] Supabase upsert failed for ${flightNum}:`,
        error,
      );
      throw error;
    }

    return {
      success: true,
      count: uniqueRecords.length,
      providersUsed,
    };
  }

  /**
   * Resolves flights that are stuck in 'active' or 'scheduled' status
   * by checking if the aircraft (tail_number) has already started a new leg,
   * or if enough time has passed.
   */
  async resolveStuckFlights(): Promise<{ resolvedCount: number }> {
    try {
      const now = new Date();
      const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString();
      const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

      // Find flights that are potentially stuck
      const { data: stuckFlights, error: fetchError } = await supabaseAdmin
        .from("flights_history")
        .select("*")
        .not("status", "in", '("landed", "cancelled", "diverted")')
        .or(
          `departure_scheduled.lt.${fourHoursAgo},and(departure_scheduled.is.null,captured_at.lt.${twentyFourHoursAgo})`,
        );

      if (fetchError || !stuckFlights || stuckFlights.length === 0) {
        return { resolvedCount: 0 };
      }

      let resolvedCount = 0;

      for (const flight of stuckFlights) {
        let shouldResolve = false;

        // 1. If we have a tail_number, check for the next leg
        if (flight.tail_number) {
          const { data: newerFlights, error: newerError } = await supabaseAdmin
            .from("flights_history")
            .select("id, origin")
            .eq("tail_number", flight.tail_number)
            .gt("departure_scheduled", flight.departure_scheduled)
            .eq("origin", flight.arrival_iata)
            .limit(1);

          if (!newerError && newerFlights && newerFlights.length > 0) {
            console.log(`[FlightService] Resolving ${flight.flight_num} (${flight.flight_date}) - Newer leg for ${flight.tail_number} detected.`);
            shouldResolve = true;
          }
        }

        // 2. If no tail number OR no next leg found yet, check if it's way overdue (> 12h, or > 24h if no departure time)
        if (!shouldResolve) {
          if (flight.departure_scheduled && flight.departure_scheduled < twelveHoursAgo) {
            console.log(`[FlightService] Resolving ${flight.flight_num} (${flight.flight_date}) - Significantly overdue (>12h).`);
            shouldResolve = true;
          } else if (!flight.departure_scheduled && flight.captured_at < twentyFourHoursAgo) {
            console.log(`[FlightService] Resolving ${flight.flight_num} (${flight.flight_date}) - No departure time and old capture (>24h).`);
            shouldResolve = true;
          }
        }

        if (shouldResolve) {
          await supabaseAdmin
            .from("flights_history")
            .update({
              status: "landed",
              is_system_closed: true,
            })
            .eq("id", flight.id);

          resolvedCount++;
        }
      }

      return { resolvedCount };
    } catch (error) {
      console.error("[FlightService] resolveStuckFlights failed:", error);
      Sentry.captureException(error);
      return { resolvedCount: 0 };
    }
  }

  /**
   * Enriches flight data by attempting to recover missing tail numbers
   * using a local cache, OpenSky, and Hexdb.
   */
  private async enrichFlightData(record: FlightRecord): Promise<FlightRecord> {
    if (record.tail_number && record.tail_number !== "UNKNOWN") return record;

    const flightIata = record.flight_num;
    if (!flightIata || flightIata === "UNKNOWN") return record;

    try {
      // 1. Try local cache first
      const { data: cacheHit } = await supabaseAdmin
        .from("aircraft_cache")
        .select("tail_number")
        .eq("flight_iata", flightIata)
        .maybeSingle();

      if (cacheHit?.tail_number) {
        console.log(
          `[FlightService] Cache hit for ${flightIata}: ${cacheHit.tail_number}`,
        );
        return { ...record, tail_number: cacheHit.tail_number };
      }
      // 2. Local cache only for sync flow
      // (OpenSky/Hexdb enrichment moved to dedicated /api/enrich-aircraft endpoint)
      return { ...record, tail_number: null };
    } catch (error) {
      console.warn(
        `[FlightService] Enrichment failed for ${flightIata}:`,
        error,
      );
    }

    return record;
  }
}
