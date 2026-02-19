import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { OpenSkyClient } from "@/utils/opensky/client";
import * as Sentry from "@sentry/nextjs";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // 1. Security Check
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 2. Define "Stale" Threshold (e.g., 4 hours past estimated arrival)
    // We want to find flights that are 'active' but should have landed long ago.
    // Postgres interval syntax: NOW() - INTERVAL '4 hours'

    // 3. Update Stale Records
    const { data, error } = await supabaseAdmin
      .from("flights_history")
      .update({ status: "unknown", is_system_closed: true })
      .eq("status", "active")
      .lt(
        "arrival_estimated",
        new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      ) // 4 hours ago
      .select();

    if (error) {
      console.error("Cleanup Error (Stale):", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 4. Update No-Show Records (Scheduled but never departed)
    // Threshold: 6 hours past scheduled departure
    const { data: noShowData, error: noShowError } = await supabaseAdmin
      .from("flights_history")
      .update({ status: "unknown", is_system_closed: true })
      .eq("status", "scheduled")
      .lt(
        "departure_scheduled",
        new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      ) // 6 hours ago
      .select();

    if (noShowError) {
      console.error("Cleanup Error (No-Show):", noShowError);
      return NextResponse.json({ error: noShowError.message }, { status: 500 });
    }

    // 5. Ghost Flight Heuristics (Active but not in ADS-B)
    // Constraint: Flight must be active AND departed > 45 mins ago
    // This avoids flagging flights that are just taking off or have poor coverage near ground
    const fortyFiveMinsAgo = new Date(
      Date.now() - 45 * 60 * 1000,
    ).toISOString();

    const { data: activeFlights, error: activeError } = await supabaseAdmin
      .from("flights_history")
      .select("*")
      .eq("status", "active")
      .lt("departure_scheduled", fortyFiveMinsAgo);

    let ghostCount = 0;
    const ghostRecords: string[] = [];

    if (activeFlights && activeFlights.length > 0) {
      console.log(
        `Checking ${activeFlights.length} potential ghost flights...`,
      );
      try {
        const openSkyFlights = await OpenSkyClient.getFlightsInVenezuela();

        for (const flight of activeFlights) {
          const isVerified = await OpenSkyClient.verifyFlightActive(
            flight.flight_num,
            openSkyFlights,
          );

          if (!isVerified) {
            // Mark as unknown/ghost
            console.log(
              `👻 Ghost detected: ${flight.flight_num}. Marking as unknown.`,
            );
            await supabaseAdmin
              .from("flights_history")
              .update({ status: "unknown", is_system_closed: true })
              .eq("id", flight.id); // Assuming id is PK

            ghostCount++;
            ghostRecords.push(flight.flight_num);
          }
        }
      } catch (err) {
        console.error("OpenSky Cleanup Check Failed:", err);
      }
    }

    return NextResponse.json({
      message: "Cleanup successful",
      stale_count: data.length,
      stale_records: data.map((f) => f.flight_num),
      no_show_count: noShowData.length,
      no_show_records: noShowData.map((f) => f.flight_num),
      ghost_count: ghostCount,
      ghost_records: ghostRecords,
    });
  } catch (error: any) {
    console.error("Cleanup Unexpected Error:", error);
    Sentry.captureException(error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
