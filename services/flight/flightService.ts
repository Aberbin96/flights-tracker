import { FlightRecord } from "@/types/flight";
import { IFlightProvider } from "./types";
import { supabaseAdmin } from "@/utils/supabase/admin";
import * as Sentry from "@sentry/nextjs";

export class FlightService {
  private providers: IFlightProvider[];

  constructor(providers: IFlightProvider[]) {
    this.providers = providers;
  }

  async syncAirport(
    iata: string,
  ): Promise<{ success: boolean; count: number; providersUsed: string[] }> {
    let allRecords: FlightRecord[] = [];
    const providersUsed: string[] = [];

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
          // If we got good data from one provider, do we stop or combine?
          // For now, we combine and deduplicate.
        }
      } catch (error: any) {
        const isRateLimit =
          error.response?.status === 429 ||
          error.message?.includes("rate limit");

        console.warn(
          `[FlightService] Provider ${provider.name} ${isRateLimit ? "rate limited" : "failed"} for ${iata}. ${!isRateLimit ? "Skipping..." : ""}`,
        );

        if (!isRateLimit) {
          Sentry.captureException(error);
        }
      }
    }

    if (allRecords.length === 0) {
      return { success: false, count: 0, providersUsed };
    }

    // Deduplicate
    const uniqueRecordsMap = new Map<string, FlightRecord>();
    allRecords.forEach((record) => {
      const key = `${record.flight_num}-${record.flight_date}`;
      // Basic merge strategy: newer 'captured_at' or more detailed info could be prioritized
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
   * by checking if the aircraft (tail_number) has already started a new leg.
   */
  async resolveStuckFlights(): Promise<{ resolvedCount: number }> {
    try {
      // 1. Find flights that are potentially stuck
      // Criteria: Not landed/cancelled/diverted, and older than 4 hours past departure
      const fourHoursAgo = new Date(
        Date.now() - 4 * 60 * 60 * 1000,
      ).toISOString();

      const { data: stuckFlights, error: fetchError } = await supabaseAdmin
        .from("flights_history")
        .select("*")
        .not("status", "in", '("landed", "cancelled", "diverted")')
        .lt("departure_scheduled", fourHoursAgo)
        .not("tail_number", "is", null);

      if (fetchError || !stuckFlights || stuckFlights.length === 0) {
        return { resolvedCount: 0 };
      }

      let resolvedCount = 0;

      for (const flight of stuckFlights) {
        // 2. Check if this aircraft has a NEWER flight
        // Criteria: same tail_number, departure > current, and origin == current.arrival
        const { data: newerFlights, error: newerError } = await supabaseAdmin
          .from("flights_history")
          .select("id, origin")
          .eq("tail_number", flight.tail_number)
          .gt("departure_scheduled", flight.departure_scheduled)
          .eq("origin", flight.arrival_iata) // Strict check: next flight must start where this one ended
          .limit(1);

        if (!newerError && newerFlights && newerFlights.length > 0) {
          // 3. Mark as landed via system
          console.log(
            `[FlightService] Resolving stuck flight ${flight.flight_num} (${flight.flight_date}) for aircraft ${flight.tail_number}. Newer leg detected.`,
          );

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
