import { FlightService } from "../services/flight/flightService";
import { AviationStackAdapter } from "../services/flight/adapters/AviationStackAdapter";
import { AeroDataBoxAdapter } from "../services/flight/adapters/AeroDataBoxAdapter";
import { TRACKED_AIRPORTS } from "../constants/flights";
import { supabaseAdmin } from "../utils/supabase/admin";
import fs from "fs";
import path from "path";

async function syncData() {
  console.log("Starting data sync...");

  const providers = [];
  if (process.env.AVIATION_API_KEY) {
    providers.push(new AviationStackAdapter(process.env.AVIATION_API_KEY));
  }
  if (process.env.AERODATABOX_API_KEY) {
    providers.push(new AeroDataBoxAdapter(process.env.AERODATABOX_API_KEY));
  }

  if (providers.length === 0) {
    console.error("No API providers configured");
    process.exit(1);
  }

  const flightService = new FlightService(providers);

  for (const airport of TRACKED_AIRPORTS) {
    console.log(`Syncing ${airport}...`);
    try {
      const result = await flightService.syncAirport(airport);
      if (result.success) {
        console.log(`Successfully synced ${result.count} flights for ${airport}`);
      }
    } catch (error) {
      console.error(`Failed to sync ${airport}:`, error);
    }
  }

  console.log("Sync completed successfully.");
}

syncData().catch(console.error);
