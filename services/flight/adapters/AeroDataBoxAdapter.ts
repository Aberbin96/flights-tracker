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

      const departures = (response.data.departures || []).map((f: any) => ({
        ...f,
        direction: "Departure",
      }));
      const arrivals = (response.data.arrivals || []).map((f: any) => ({
        ...f,
        direction: "Arrival",
      }));

      const mappedDepartures = this.mapRecords(departures, iata, "Departure");
      const mappedArrivals = this.mapRecords(arrivals, iata, "Arrival");

      return [...mappedDepartures, ...mappedArrivals];
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

  private mapRecords(
    data: any[],
    contextIata?: string,
    directionHint?: "Departure" | "Arrival",
  ): FlightRecord[] {
    return data
      .map((f: any) => {
        const flightNum = f.number || "UNKNOWN";
        const airline = f.airline?.name || "Unknown Airline";

        let origin = "UNKNOWN";
        let arrivalIata = "UNKNOWN";
        const departureScheduled = f.departure?.scheduledTime?.local || null;
        const arrivalEstimated = f.arrival?.scheduledTime?.local || null;
        const arrivalActual = f.arrival?.revisedTime?.local || null;
        const status = this.mapStatus(f.status);
        const departureActual = f.departure?.revisedTime?.local || null;

        if (directionHint === "Departure") {
          origin = contextIata || "UNKNOWN";
          arrivalIata = f.arrival?.airport?.iata || "UNKNOWN";
        } else if (directionHint === "Arrival") {
          origin = f.departure?.airport?.iata || "UNKNOWN";
          arrivalIata = contextIata || "UNKNOWN";
        } else {
          origin = f.departure?.airport?.iata || "UNKNOWN";
          arrivalIata = f.arrival?.airport?.iata || "UNKNOWN";
        }

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
          arrival_actual: arrivalActual,
          arrival_estimated: arrivalEstimated,
          arrival_iata: arrivalIata,
          departure_scheduled: departureScheduled,
          is_system_closed: false,
          tail_number: f.aircraft?.reg || null,
          icao24: f.aircraft?.modeS || null,
        } as FlightRecord;
      })
      .filter(
        (record: FlightRecord) =>
          record.flight_num !== "UNKNOWN" &&
          record.origin !== "UNKNOWN" &&
          record.arrival_iata !== "UNKNOWN",
      );
  }

  private mapStatus(adbStatus: string): FlightStatus {
    switch (adbStatus?.toLowerCase()) {
      case "scheduled":
      case "expected":
      case "checkin":
      case "boarding":
      case "gateclosed":
      case "delayed":
        return FlightStatus.SCHEDULED;
      case "active":
      case "enroute":
      case "departed":
      case "approaching":
        return FlightStatus.ACTIVE;
      case "landed":
      case "arrived":
        return FlightStatus.LANDED;
      case "canceled":
      case "canceleduncertain":
        return FlightStatus.CANCELLED;
      case "diverted":
        return FlightStatus.DIVERTED;
      default:
        return FlightStatus.UNKNOWN;
    }
  }
}
