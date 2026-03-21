import { supabaseAdmin } from "../utils/supabase/admin";
import { HexdbAdapter } from "../services/flight/adapters/HexdbAdapter";
import { DB_TABLES } from "../constants/database";
import { FlightRecord } from "../types/flight";

async function enrichAircraft() {
  console.log("Starting aircraft enrichment...");
  const hexdb = new HexdbAdapter();
  let enrichedCount = 0;

  try {
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
      console.log("No flights matching criteria for Hexdb enrichment");
      return;
    }

    const typedFlights = flights as FlightRecord[];
    console.log(`Processing ${typedFlights.length} flights via Hexdb resolution...`);

    for (const flight of typedFlights) {
      const flightIata = flight.flight_num;
      const flightId = flight.id as unknown as string;
      const hexCode = flight.icao24;

      if (!flightIata || !hexCode) continue;

      try {
        console.log(`Resolving hex ${hexCode} for ${flightIata}...`);
        const registration = await hexdb.getRegistration(hexCode);
        const attempts = (flight.enrichment_attempts || 0) + 1;

        if (registration) {
          console.log(`SUCCESS for ${flightIata}: ${registration}`);
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
        } else {
          console.log(`Registration not found for ${hexCode} (Attempt ${attempts})`);
          await supabaseAdmin
            .from(DB_TABLES.FLIGHTS_HISTORY)
            .update({
              enrichment_attempts: attempts,
              last_enrichment_attempt: new Date().toISOString(),
            })
            .eq("id", flightId);
        }
      } catch (innerError) {
        console.warn(`Error processing flight ${flightIata}:`, innerError);
      }
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
    console.log(`Enrichment completed. Enriched: ${enrichedCount}`);
  } catch (error) {
    console.error("Global Enrichment Error:", error);
    process.exit(1);
  }
}

enrichAircraft().catch(console.error);
