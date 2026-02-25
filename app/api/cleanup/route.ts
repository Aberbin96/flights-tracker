import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/utils/supabase/admin";
import * as Sentry from "@sentry/nextjs";
import { FlightStatus } from "@/types/flight";
import { FlightService } from "@/services/flight/flightService";

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

    // HEURISTIC C: Next-Leg Validation
    // Resolves flights that are stuck in 'active' or 'scheduled' status
    // by checking if the aircraft (tail_number) has already started a new leg.
    const flightService = new FlightService([]);
    const resolution = await flightService.resolveStuckFlights();

    return NextResponse.json({
      message: "Cleanup successful",
      auto_unknown_from_active_count: landedData?.length || 0,
      auto_unknown_from_scheduled_count: cancelledData?.length || 0,
      next_leg_resolved_count: resolution.resolvedCount,
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
