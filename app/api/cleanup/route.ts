import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/utils/supabase/admin";
import * as Sentry from "@sentry/nextjs";
import { FlightStatus } from "@/types/flight";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // 1. Security Check
  const authHeader = request.headers.get("authorization");
  if (
    authHeader !== `Bearer ${process.env.CRON_SECRET}` &&
    process.env.NODE_ENV !== "development"
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 2. Intelligent Auto-Closure Heuristics

    // HEURISTIC A: Stuck Active Flights -> Transition to 'unknown'
    // If a flight is marked 'active' but its estimated arrival passed more than 4 hours ago,
    // we assume we lost tracking of the flight.
    const { data: landedData, error: landedError } = await supabaseAdmin
      .from("flights_history")
      .update({ status: FlightStatus.UNKNOWN, is_system_closed: true })
      .eq("status", "active")
      .lt(
        "arrival_estimated",
        new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      )
      .select();

    if (landedError) {
      console.error("Cleanup Error (Landed Heuristic):", landedError);
      return NextResponse.json({ error: landedError.message }, { status: 500 });
    }

    // HEURISTIC B: Stuck Scheduled Flights -> Transition to 'unknown'
    // If a flight is 'scheduled' but its departure time passed more than 12 hours ago
    // without ever turning 'active', we assume we lost tracking of it.
    const { data: cancelledData, error: cancelledError } = await supabaseAdmin
      .from("flights_history")
      .update({ status: FlightStatus.UNKNOWN, is_system_closed: true })
      .eq("status", "scheduled")
      .lt(
        "departure_scheduled",
        new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      )
      .select();

    if (cancelledError) {
      console.error("Cleanup Error (Cancelled Heuristic):", cancelledError);
      return NextResponse.json(
        { error: cancelledError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      message: "Cleanup successful",
      auto_unknown_from_active_count: landedData.length,
      auto_unknown_from_active_records: landedData.map((f) => f.flight_num),
      auto_unknown_from_scheduled_count: cancelledData.length,
      auto_unknown_from_scheduled_records: cancelledData.map(
        (f) => f.flight_num,
      ),
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
