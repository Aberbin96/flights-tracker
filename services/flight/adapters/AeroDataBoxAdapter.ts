import axios from "axios";
import { FlightStatus, FlightRecord } from "@/types/flight";
import { IFlightProvider } from "../types";
import { StatusService } from "../statusService";

interface AeroDataBoxFlight {
  number: string;
  airline: {
    name: string | null;
  } | null;
  departure: {
    airport: {
      iata: string | null;
    } | null;
    scheduledTime: {
      local: string | null;
      utc: string | null;
    } | null;
    revisedTime: {
      local: string | null;
      utc: string | null;
    } | null;
  } | null;
  arrival: {
    airport: {
      iata: string | null;
    } | null;
    scheduledTime: {
      local: string | null;
      utc: string | null;
    } | null;
    revisedTime: {
      local: string | null;
      utc: string | null;
    } | null;
  } | null;
  status: string;
  aircraft: {
    reg: string | null;
    modeS: string | null;
  } | null;
}

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

      const { data: responseBody, headers } = response;
      this.updateLimitsFromHeaders(headers);

      const departures = (
        (responseBody.departures as AeroDataBoxFlight[]) || []
      ).map((f) => ({
        ...f,
        direction: "Departure",
      }));
      const arrivals = (
        (responseBody.arrivals as AeroDataBoxFlight[]) || []
      ).map((f) => ({
        ...f,
        direction: "Arrival",
      }));

      const mappedDepartures = this.mapRecords(departures, iata, "Departure");
      const mappedArrivals = this.mapRecords(arrivals, iata, "Arrival");

      return [...mappedDepartures, ...mappedArrivals];
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        console.error(
          `[AeroDataBoxAdapter] Error fetching FIDS for ${iata}:`,
          error.response?.status,
          error.response?.data || error.message,
        );
      } else {
        console.error(
          `[AeroDataBoxAdapter] Error fetching FIDS for ${iata}:`,
          error,
        );
      }
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

      const { data: responseBody, headers } = response;
      this.updateLimitsFromHeaders(headers);

      const data = responseBody || [];
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

  private updateLimitsFromHeaders(headers: any) {
    const limit = headers["x-ratelimit-requests-limit"];
    const remaining = headers["x-ratelimit-requests-remaining"];
    const reset = headers["x-ratelimit-requests-reset"];

    if (limit !== undefined || remaining !== undefined) {
      StatusService.updateLimit({
        service: "aerodatabox",
        requests_limit: limit ? parseInt(limit, 10) : null,
        requests_remaining: remaining ? parseInt(remaining, 10) : null,
        reset_at: reset ? new Date(parseInt(reset, 10) * 1000).toISOString() : null,
      });
    }
  }

  private mapRecords(
    data: AeroDataBoxFlight[],
    contextIata?: string,
    directionHint?: "Departure" | "Arrival",
  ): FlightRecord[] {
    return data
      .map((f) => {
        const flightNum = f.number || "UNKNOWN";
        const airline = f.airline?.name || "Unknown Airline";

        let origin = "UNKNOWN";
        let arrivalIata = "UNKNOWN";

        // Prefer UTC over local to avoid timezone ambiguity during server-side processing
        const departureScheduled = f.departure?.scheduledTime?.utc || f.departure?.scheduledTime?.local || null;
        const arrivalEstimated = f.arrival?.scheduledTime?.utc || f.arrival?.scheduledTime?.local || null;
        const arrivalActual = f.arrival?.revisedTime?.utc || f.arrival?.revisedTime?.local || null;
        const departureActual = f.departure?.revisedTime?.utc || f.departure?.revisedTime?.local || null;

        // Ensure timestamps have 'Z' suffix if they are UTC but missing the indicator
        const normalizeToUtc = (ts: string | null) => {
          if (!ts) return null;
          if (ts.includes("Z") || ts.includes("+") || (ts.includes("-") && ts.split("-").length > 3)) return ts;
          // If it's a UTC field from AeroDataBox, it might be space-separated or missing Z
          return ts.replace(" ", "T") + "Z";
        };

        const depSchedUtc = normalizeToUtc(departureScheduled);
        const arrEstUtc = normalizeToUtc(arrivalEstimated);
        const arrActUtc = normalizeToUtc(arrivalActual);
        const depActUtc = normalizeToUtc(departureActual);

        let status = this.mapStatus(f.status);

        // Fallback logic if status is unknown
        if (status === FlightStatus.UNKNOWN) {
          if (arrivalActual) {
            status = FlightStatus.LANDED;
          } else if (departureActual) {
            status = FlightStatus.ACTIVE;
          } else if (departureScheduled) {
            const now = Date.now();
            const schedDepartureTime = new Date(departureScheduled).getTime();
            const isFuture = schedDepartureTime > now;
            
            if (isFuture) {
              status = FlightStatus.SCHEDULED;
            } else {
              // If it's in the past, check if it should have landed by now
              const estArrival = arrEstUtc ? new Date(arrEstUtc).getTime() : null;
              if (estArrival && now > (estArrival + 3600000)) { // 1 hour buffer after estimated arrival
                status = FlightStatus.LANDED;
              } else if (now > (schedDepartureTime + 43200000)) { // 12 hours after scheduled departure
                status = FlightStatus.LANDED;
              } else {
                status = FlightStatus.ACTIVE;
              }
            }
          }
        }

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
        if (depSchedUtc && depActUtc) {
          const scheduled = new Date(depSchedUtc).getTime();
          const actual = new Date(depActUtc).getTime();
          delayMinutes = Math.max(0, Math.round((actual - scheduled) / 60000));
        }

        return {
          flight_num: flightNum,
          airline: airline,
          origin: origin,
          status: status,
          delay_minutes: delayMinutes,
          captured_at: new Date().toISOString(),
          flight_date: depSchedUtc
            ? depSchedUtc.split("T")[0]
            : new Date().toISOString().split("T")[0],
          arrival_actual: arrActUtc,
          arrival_estimated: arrEstUtc,
          arrival_iata: arrivalIata,
          departure_scheduled: depSchedUtc,
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
