import axios from "axios";
import { FlightStatus, FlightRecord } from "@/types/flight";
import { IFlightProvider } from "../types";

/**
 * AeroDataBox API Adapter (via RapidAPI)
 * Note: AeroDataBox uses separate endpoints for departures and arrivals.
 * We primarily focus on departures (sync by airport as origin).
 */
export class AeroDataBoxAdapter implements IFlightProvider {
  name = "AeroDataBox";
  private apiKey: string;
  private host = "aerodatabox.p.rapidapi.com";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async fetchFlightsByAirport(iata: string): Promise<FlightRecord[]> {
    try {
      // Use FIDS endpoint with relative time offsets as suggested by the user
      // offsetMinutes -120 (2h ago), durationMinutes 720 (12h window)
      const response = await axios.get(
        `https://${this.host}/flights/airports/iata/${iata}`,
        {
          headers: {
            "x-rapidapi-key": this.apiKey,
            "x-rapidapi-host": this.host,
          },
          params: {
            offsetMinutes: -120,
            durationMinutes: 720,
            withLeg: true,
            direction: "Both",
            withCancelled: true,
            withCodeshared: true,
            withCargo: true,
            withPrivate: true,
            withLocation: false,
          },
        },
      );

      const departures = response.data.departures || [];
      const arrivals = response.data.arrivals || [];
      const allMovements = [...departures, ...arrivals];

      console.log(
        `[AeroDataBoxAdapter] Fetched ${allMovements.length} movements for ${iata} using FIDS endpoint`,
      );

      return this.mapRecords(allMovements, iata);
    } catch (error: any) {
      console.error(
        `[AeroDataBoxAdapter] Error fetching FIDS for ${iata}:`,
        error.response?.status,
        error.response?.data || error.message,
      );
      return [];
    }
  }

  async fetchFlightsByNumber(flightNum: string): Promise<FlightRecord[]> {
    try {
      const response = await axios.get(
        `https://${this.host}/flights/number/${flightNum}`,
        {
          headers: {
            "x-rapidapi-key": this.apiKey,
            "x-rapidapi-host": this.host,
          },
        },
      );

      const data = response.data || [];
      // AeroDataBox returns an array of flight instances for that number
      return this.mapRecords(Array.isArray(data) ? data : [data]);
    } catch (error) {
      console.error(
        `[AeroDataBoxAdapter] Error fetching flight ${flightNum}:`,
        error,
      );
      return [];
    }
  }

  private mapRecords(data: any[], defaultOrigin?: string): FlightRecord[] {
    return data
      .map((f: any) => {
        const flightNum = f.number || "UNKNOWN";
        const airline = f.airline?.name || "Unknown Airline";
        const origin = f.departure?.airport?.iata || defaultOrigin || "UNKNOWN";
        const arrivalIata = f.arrival?.airport?.iata || "UNKNOWN";
        const status = this.mapStatus(f.status);

        const departureScheduled =
          f.movement?.scheduledTimeLocal ||
          f.departure?.movement?.scheduledTimeLocal ||
          null;
        const departureActual =
          f.movement?.actualTimeLocal ||
          f.departure?.movement?.actualTimeLocal ||
          null;
        const arrivalEstimated =
          f.arrival?.movement?.scheduledTimeLocal || null;

        let delayMinutes = 0;
        if (departureScheduled && departureActual) {
          const scheduled = new Date(departureScheduled).getTime();
          const actual = new Date(departureActual).getTime();
          delayMinutes = Math.max(0, Math.round((actual - scheduled) / 60000));
        }

        return {
          flight_num: flightNum,
          airline: airline,
          origin: origin,
          status: status,
          delay_minutes: delayMinutes,
          captured_at: new Date().toISOString(),
          flight_date: departureScheduled
            ? departureScheduled.split("T")[0]
            : new Date().toISOString().split("T")[0],
          arrival_estimated: arrivalEstimated,
          arrival_iata: arrivalIata,
          departure_scheduled: departureScheduled,
          is_system_closed: false,
        } as FlightRecord;
      })
      .filter(
        (record: FlightRecord) =>
          record.flight_num !== "UNKNOWN" && record.arrival_iata !== "UNKNOWN",
      );
  }

  private mapStatus(adbStatus: string): FlightStatus {
    switch (adbStatus?.toLowerCase()) {
      case "scheduled":
        return FlightStatus.SCHEDULED;
      case "active":
      case "enroute":
        return FlightStatus.ACTIVE;
      case "landed":
      case "arrived":
        return FlightStatus.LANDED;
      case "cancelled":
        return FlightStatus.CANCELLED;
      case "diverted":
        return FlightStatus.DIVERTED;
      default:
        return FlightStatus.UNKNOWN;
    }
  }
}
