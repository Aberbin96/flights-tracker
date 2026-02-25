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
          allRecords = [...allRecords, ...records];
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
          allRecords = [...allRecords, ...records];
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
}
