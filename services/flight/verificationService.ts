import { supabaseAdmin } from "@/utils/supabase/admin";
import { OpenSkyAdapter } from "./adapters/OpenSkyAdapter";
import { HexdbAdapter } from "./adapters/HexdbAdapter";
import { AIRPORT_COORDINATES, getDistanceKm } from "@/constants/geo";
import { FlightStatus } from "@/types/flight";
import { resolveCallsign } from "./callsignResolver";
import * as Sentry from "@sentry/nextjs";

export class VerificationService {
  private openSky: OpenSkyAdapter;
  private hexdb: HexdbAdapter;

  constructor() {
    this.openSky = new OpenSkyAdapter();
    this.hexdb = new HexdbAdapter();
  }

  /**
   * Run verification for flights that are stuck in unknown or scheduled status.
   * (Deprecating in favor of runAutoVerification for cron use)
   */
  async verifyStuckFlights(): Promise<{ verifiedCount: number; logs: any[] }> {
    const result = await this.runAutoVerification();
    return { verifiedCount: result.updatedCount, logs: result.logs };
  }

  /**
   * Automated verification for real-time tracking.
   * Detects takeoffs, landings, and delays.
   */
  async runAutoVerification(): Promise<{ processedCount: number; updatedCount: number; logs: any[] }> {
    try {
      const now = new Date();
      const minus1Hour = new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString();
      const plus3Hours = new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString();

      // Find flights that are "Relevant Now"
      // 1. Scheduled to depart soon or recently past
      // 2. Currently active
      const { data: candidates, error: fetchError } = await supabaseAdmin
        .from("flights_history")
        .select("*")
        .in("status", [FlightStatus.SCHEDULED, FlightStatus.ACTIVE, FlightStatus.UNKNOWN])
        .gt("departure_scheduled", minus1Hour)
        .lt("departure_scheduled", plus3Hours);

      if (fetchError || !candidates) {
        return { processedCount: 0, updatedCount: 0, logs: [] };
      }

      console.log(`[VerificationService] Auto-verifying ${candidates.length} flights.`);

      let updatedCount = 0;
      const logs: any[] = [];

      for (const flight of candidates) {
        const flightLog: any = {
           id: flight.id,
           flight_num: flight.flight_num,
           current_status: flight.status,
           actions: []
        };

        const { updated } = await this._verifySingleFlight(flight, flightLog);
        if (updated) updatedCount++;
        logs.push(flightLog);
      }

      return { processedCount: candidates.length, updatedCount, logs };
    } catch (error) {
      console.error("[VerificationService] runAutoVerification failed:", error);
      Sentry.captureException(error);
      return { processedCount: 0, updatedCount: 0, logs: [] };
    }
  }

  /**
   * Core logic to verify a single flight using OpenSky and other sources.
   */
  private async _verifySingleFlight(flight: any, flightLog: any): Promise<{ updated: boolean }> {
    let icao24 = flight.icao24;
    let updated = false;

    // --- AIRCRAFT METADATA RECOVERY LOGIC ---
    if (!icao24) {
       // 1. Try recovery via tail_number (Hexdb reverse lookup)
       if (flight.tail_number) {
          flightLog.actions.push(`Attempting ICAO24 recovery for tail number: ${flight.tail_number}`);
          const hexFromReg = await this.hexdb.getHexCode(flight.tail_number);
          if (hexFromReg) {
             icao24 = hexFromReg;
             flightLog.icao24_recovered = hexFromReg;
             flightLog.actions.push(`Recovered ICAO24 (${hexFromReg}) from registration.`);
          }
       }
    }

    if (!icao24) {
      const callsign = resolveCallsign(flight.flight_num);
      if (callsign) {
         flightLog.actions.push(`Attempting ICAO24 recovery for callsign: ${callsign}`);
         const recoveredIcao24 = await this.openSky.fetchLastIcao24ByCallsign(callsign);
         if (recoveredIcao24) {
            icao24 = recoveredIcao24;
            flightLog.icao24_recovered = recoveredIcao24;
            flightLog.actions.push(`Recovered ICAO24 (${recoveredIcao24}) via callsign.`);
            
            // Save recovered ICAO24 immediately
            await supabaseAdmin.from("flights_history").update({ icao24 }).eq("id", flight.id);
         }
      }
    }

    // --- DELAY DETECTION ---
    const now = new Date();
    const scheduledDeparture = flight.departure_scheduled ? new Date(flight.departure_scheduled) : null;
    
    if (scheduledDeparture && flight.status === FlightStatus.SCHEDULED) {
       const diffMinutes = Math.floor((now.getTime() - scheduledDeparture.getTime()) / (1000 * 60));
       if (diffMinutes > 30) {
          flightLog.actions.push(`Flight is potentially delayed (+${diffMinutes}m past scheduled).`);
          // We don't change status to DELAYED yet, just log and update delay_minutes if visible
          await supabaseAdmin.from("flights_history").update({ delay_minutes: diffMinutes }).eq("id", flight.id);
       }
    }

    if (!icao24) {
      flightLog.actions.push("Skipping live check: No ICAO24 available.");
      return { updated: false };
    }

    const state = await this.openSky.fetchStateByIcao24(icao24);
    
    if (!state) {
      flightLog.actions.push(`No live state found for ${icao24}. Aircraft might be out of range or transponder off.`);
      return { updated: false };
    }

    flightLog.state = {
      on_ground: state.on_ground,
      lat: state.latitude,
      lon: state.longitude,
      alt_ft: state.baro_altitude ? state.baro_altitude * 3.28084 : null
    };

    // --- DELAY UPDATE FOR ACTIVE-BUT-GROUNDED FLIGHTS ---
    // AviationStack caps departure.delay at 60 min. If the API marks a flight as ACTIVE
    // but OpenSky confirms it's still on the ground, recalculate delay from elapsed time.
    if (scheduledDeparture && flight.status === FlightStatus.ACTIVE && state.on_ground) {
      const diffMinutes = Math.floor((now.getTime() - scheduledDeparture.getTime()) / (1000 * 60));
      if (diffMinutes > 30) {
        flightLog.actions.push(`Active flight still on ground. Updating delay to +${diffMinutes}m.`);
        await supabaseAdmin.from("flights_history").update({ delay_minutes: diffMinutes }).eq("id", flight.id);
      }
    }

    let newStatus: FlightStatus | null = null;

    // --- TAKEOFF DETECTION ---
    if (!state.on_ground && (flight.status === FlightStatus.SCHEDULED || flight.status === FlightStatus.UNKNOWN)) {
       flightLog.actions.push("Aircraft detected in air. Marking as ACTIVE (Takeoff).");
       newStatus = FlightStatus.ACTIVE;
    }

    // --- LANDING DETECTION & PROXIMITY ---
    const targetCoords = AIRPORT_COORDINATES[flight.arrival_iata];
    if (targetCoords && state.latitude && state.longitude) {
       const distance = getDistanceKm(state.latitude, state.longitude, targetCoords.lat, targetCoords.lng);
       const altFt = state.baro_altitude ? state.baro_altitude * 3.28084 : 99999;

       if (state.on_ground && distance < 5) {
          flightLog.actions.push(`Detected on ground at destination (${distance.toFixed(2)}km). Marking as LANDED.`);
          newStatus = FlightStatus.LANDED;
       } else if (!state.on_ground && distance < 10 && altFt < 1000) {
          flightLog.actions.push(`Proximity Hit: landing pattern detected (dist=${distance.toFixed(2)}km, alt=${altFt.toFixed(0)}ft). Marking as LANDED.`);
          newStatus = FlightStatus.LANDED;
       } else if (distance < 30) {
          flightLog.actions.push(`Aircraft in vicinity of ${flight.arrival_iata} (${distance.toFixed(2)}km, alt=${altFt.toFixed(0)}ft).`);
       }
    }

    // --- STATUS UPDATE ---
    if (newStatus && newStatus !== flight.status) {
      const { error: updateError } = await supabaseAdmin
        .from("flights_history")
        .update({ 
           status: newStatus,
           captured_at: new Date().toISOString()
        })
        .eq("id", flight.id);

      if (!updateError) {
         flightLog.actions.push(`Status updated correctly to ${newStatus}.`);
         updated = true;
      } else {
         flightLog.actions.push(`Update failed: ${updateError.message}`);
      }
    } else {
       flightLog.actions.push("No status change required based on current state.");
    }

    return { updated };
  }
}
