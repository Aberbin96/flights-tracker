import { NextResponse } from "next/server";
import axios from "axios";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { FlightStatus, FlightRecord } from "@/app/types/flight";
import { OpenSkyClient } from "@/utils/opensky/client";

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
    // 2. Fetch Data from Aviationstack for Multiple Airports
    const AIRPORTS = ["CCS", "MAR", "VLN", "PMV", "BLA"];
    let allFlights: any[] = [];

    console.log(`Starting sync for airports: ${AIRPORTS.join(", ")}`);

    for (const airport of AIRPORTS) {
      try {
        console.log(`Fetching flights for ${airport}...`);
        const response = await axios.get(
          "http://api.aviationstack.com/v1/flights",
          {
            params: {
              access_key: AVIATION_API_KEY,
              dep_iata: airport,
              limit: 100,
            },
            timeout: 10000, // 10s timeout per request
          },
        );

        const data = response.data.data || [];
        console.log(`  ${airport}: Found ${data.length} flights.`);
        allFlights = [...allFlights, ...data];

        // Small delay to be nice to the API
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (err) {
        console.error(`Failed to fetch ${airport}:`, err);
        // Continue to next airport
      }
    }

    const flights = allFlights;
    console.log("Total flights fetched:", flights.length);

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

        // Robust flight date extraction
        const flightDate =
          flight.flight_date ||
          (flight.departure.scheduled &&
            flight.departure.scheduled.split("T")[0]) ||
          new Date().toISOString().split("T")[0];

        // Extract estimated arrival time
        const arrivalEstimated =
          flight.arrival.estimated || flight.arrival.scheduled || null;

        // Extract actual arrival time
        const arrivalActual = flight.arrival.actual || null;

        // Prioritize actual arrival status
        if (arrivalActual) {
          status = FlightStatus.LANDED;
        }

        // Manual Delay Calculation
        let delayMinutes = flight.departure.delay || 0;
        if (flight.departure.scheduled && flight.departure.actual) {
          const scheduledTime = new Date(flight.departure.scheduled).getTime();
          const actualTime = new Date(flight.departure.actual).getTime();
          const diffMinutes = Math.round((actualTime - scheduledTime) / 60000);
          // Treat early or on-time as 0 delay, otherwise use the difference
          delayMinutes = Math.max(0, diffMinutes);
        }

        // Extract scheduled departure time
        const departureScheduled = flight.departure.scheduled || null;

        return {
          flight_num: flightNum,
          airline: airline,
          origin: origin,
          status: status,
          delay_minutes: delayMinutes,
          captured_at: new Date().toISOString(),
          flight_date: flightDate,
          arrival_estimated: arrivalEstimated,
          arrival_actual: arrivalActual,
          departure_scheduled: departureScheduled,
        } as FlightRecord;
      })
      .filter((record: FlightRecord) => {
        // Filter out records that are completely broken/useless
        // We keep 'unknown' status but filter out if flight_num is truly unknown effectively invalidating the record
        const isValid =
          record.flight_num !== "UNKNOWN" && record.origin !== "UNKNOWN";
        return isValid;
      });

    // Deduplicate records based on flight_num and flight_date to prevent "ON CONFLICT DO UPDATE command cannot affect row a second time"
    const uniqueRecordsMap = new Map<string, FlightRecord>();
    recordsToInsert.forEach((record) => {
      const key = `${record.flight_num}-${record.flight_date}`;
      uniqueRecordsMap.set(key, record);
    });
    const uniqueRecords = Array.from(uniqueRecordsMap.values());

    // 4. Multi-Source Verification (OpenSky)
    // Filter for flights that are currently "active" or "scheduled" and departing soon to check against ADS-B
    const activeFlights = uniqueRecords.filter(
      (f) => f.status === FlightStatus.ACTIVE,
    );

    if (activeFlights.length > 0) {
      console.log(
        `Verifying ${activeFlights.length} active flights with OpenSky Network...`,
      );
      try {
        const openSkyFlights = await OpenSkyClient.getFlightsInVenezuela();
        console.log(
          `OpenSky reports ${openSkyFlights.length} airborne flights in region.`,
        );

        for (const flight of activeFlights) {
          // flight_num is usually the IATA code (e.g. QL1966).
          // OpenSky uses callsigns which often match or contain the IATA/ICAO code.
          // We'll try to match loosely.
          const isVerified = await OpenSkyClient.verifyFlightActive(
            flight.flight_num,
            openSkyFlights,
          );

          if (isVerified) {
            console.log(
              `✅ Flight ${flight.flight_num} VERIFIED airborne by OpenSky.`,
            );
            // TODO: Update a 'verified' column in DB
          } else {
            console.warn(
              `⚠️ Flight ${flight.flight_num} status is ACTIVE but not found in OpenSky ADS-B data.`,
            );
          }
        }
      } catch (err) {
        console.error("OpenSky Verification Failed:", err);
        // Continue with sync even if verification fails
      }
    }

    if (uniqueRecords.length > 0) {
      // 5. Insert into Supabase (Upsert using Admin Client to bypass RLS)
      const { error } = await supabaseAdmin.from("flights_history").upsert(
        uniqueRecords,
        { onConflict: "flight_num, flight_date" }, // Ensure unique constraint is respected
      );

      if (error) {
        console.error("Supabase Insert Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({
      message: "Sync successful",
      count: uniqueRecords.length,
      active_verified: activeFlights.length,
    });
  } catch (error: any) {
    console.error("Sync Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
