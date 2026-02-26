import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { HexdbAdapter } from "@/services/flight/adapters/HexdbAdapter";
import { DB_TABLES } from "@/constants/database";
import * as Sentry from "@sentry/nextjs";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // 1. Security Check
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const hexdb = new HexdbAdapter();

  let enrichedCount = 0;
  const executionDetails: Array<{
    flight_id: string;
    iata: string;
    status: "SUCCESS" | "NO_DATA" | "SKIPPED" | "ERROR";
    tail_number?: string;
    reason?: string;
    icao24?: string;
    error?: string;
    strategy?: string;
  }> = [];

  try {
    // 2. Find flights with empty or NULL tail numbers but WITH an icao24 (captured during sync)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: flights, error } = await supabaseAdmin
      .from(DB_TABLES.FLIGHTS_HISTORY)
      .select("*")
      .is("tail_number", null)
      .not("icao24", "is", null)
      .lt("enrichment_attempts", 3)
      .or(
        `last_enrichment_attempt.is.null,last_enrichment_attempt.lt.${yesterday}`,
      )
      .order("departure_scheduled", { ascending: false })
      .limit(20);

    if (error) throw error;
    if (!flights || flights.length === 0) {
      return NextResponse.json({
        message: "No flights matching criteria for Hexdb enrichment",
        count: 0,
      });
    }

    console.log(
      `[Enrichment] Processing ${flights.length} flights via Hexdb resolution...`,
    );

    for (const flight of flights as any[]) {
      const flightIata = flight.flight_num;
      const flightId = flight.id;
      const hexCode = flight.icao24;

      if (!flightIata || !hexCode) {
        executionDetails.push({
          flight_id: flightId,
          iata: flightIata,
          status: "SKIPPED",
          reason: "Missing metadata",
        });
        continue;
      }

      try {
        console.log(
          `[Enrichment] Resolving hex ${hexCode} for ${flightIata}...`,
        );
        const registration = await hexdb.getRegistration(hexCode);

        const attempts = (flight.enrichment_attempts || 0) + 1;

        if (registration) {
          console.log(
            `[Enrichment] SUCCESS for ${flightIata}: ${registration}`,
          );

          await supabaseAdmin
            .from(DB_TABLES.FLIGHTS_HISTORY)
            .update({
              tail_number: registration,
              enrichment_attempts: attempts,
              last_enrichment_attempt: new Date().toISOString(),
            })
            .eq("id", flightId);

          await supabaseAdmin.from(DB_TABLES.AIRCRAFT_CACHE).upsert({
            flight_iata: flightIata,
            tail_number: registration,
            last_seen: new Date().toISOString(),
          });

          enrichedCount++;
          executionDetails.push({
            flight_id: flightId,
            iata: flightIata,
            status: "SUCCESS",
            tail_number: registration,
            strategy: "Hexdb Resolution",
            icao24: hexCode,
          });
        } else {
          console.log(
            `[Enrichment] Registration not found for ${hexCode} (Attempt ${attempts})`,
          );
          await supabaseAdmin
            .from(DB_TABLES.FLIGHTS_HISTORY)
            .update({
              enrichment_attempts: attempts,
              last_enrichment_attempt: new Date().toISOString(),
            })
            .eq("id", flightId);

          executionDetails.push({
            flight_id: flightId,
            iata: flightIata,
            status: "NO_DATA",
            reason: "Registration not found in Hexdb",
            icao24: hexCode,
          });
        }
      } catch (innerError: unknown) {
        const errorMsg =
          innerError instanceof Error ? innerError.message : String(innerError);
        console.warn(
          `[Enrichment] Error processing flight ${flightIata}:`,
          errorMsg,
        );

        const attempts = (flight.enrichment_attempts || 0) + 1;
        await supabaseAdmin
          .from(DB_TABLES.FLIGHTS_HISTORY)
          .update({
            enrichment_attempts: attempts,
            last_enrichment_attempt: new Date().toISOString(),
          })
          .eq("id", flightId);

        executionDetails.push({
          flight_id: flightId,
          iata: flightIata,
          status: "ERROR",
          error: errorMsg,
        });
      }

      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    return NextResponse.json({
      message: "Enrichment completed",
      processed: flights.length,
      enriched: enrichedCount,
      details: executionDetails,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[Enrichment] Global Error:", error);
    Sentry.captureException(error);
    return NextResponse.json(
      { error: errorMsg || "Internal Server Error" },
      { status: 500 },
    );
  }
}
