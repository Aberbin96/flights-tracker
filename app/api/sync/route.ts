import { NextResponse } from "next/server";
import axios from "axios";
import { supabase } from "@/utils/supabase/client";
import { FlightStatus, FlightRecord } from "@/app/types/flight";

export const dynamic = "force-dynamic"; // Prevent caching of this route

export async function GET(request: Request) {
  // 1. Security Check: Verify Cron Secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const AVIATION_API_KEY = process.env.AVIATION_API_KEY;
  if (!AVIATION_API_KEY) {
    return NextResponse.json(
      { error: "API Key not configured" },
      { status: 500 },
    );
  }

  try {
    // 2. Fetch Data from Aviationstack
    const response = await axios.get(
      "http://api.aviationstack.com/v1/flights",
      {
        params: {
          access_key: AVIATION_API_KEY,
          dep_iata: "CCS",
          limit: 100,
        },
      },
    );

    const flights = response.data.data || [];

    console.log("Flights fetched:", flights.length);

    // 3. Filter & Transform Data
    const recordsToInsert: FlightRecord[] = flights
      .map((flight: any) => {
        // Robust flight number extraction
        const flightNum =
          flight.flight.iata ||
          flight.flight.icao ||
          flight.flight.number ||
          "UNKNOWN";

        // Robust airline extraction
        const airline =
          flight.airline.name || flight.airline.iata || "Unknown Airline";

        // Robust origin extraction: Start with dep_iata as priority
        const origin =
          flight.departure.iata || flight.departure.icao || "UNKNOWN";

        // Robust status mapping
        let status = flight.flight_status || FlightStatus.UNKNOWN;
        status = status.toLowerCase();

        return {
          flight_num: flightNum,
          airline: airline,
          origin: origin,
          status: status,
          delay_minutes: flight.departure.delay || 0,
          captured_at: new Date().toISOString(),
        };
      })
      .filter((record: FlightRecord) => {
        // Filter out records that are completely broken/useless
        // We keep 'unknown' status but filter out if flight_num is truly unknown effectively invalidating the record
        const isValid =
          record.flight_num !== "UNKNOWN" && record.origin !== "UNKNOWN";
        return isValid;
      });

    if (recordsToInsert.length > 0) {
      // 4. Insert into Supabase
      const { error } = await supabase
        .from("flights_history")
        .insert(recordsToInsert);

      if (error) {
        console.error("Supabase Insert Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({
      message: "Sync successful",
      count: recordsToInsert.length,
    });
  } catch (error: any) {
    console.error("Sync Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
