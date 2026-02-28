import axios from "axios";
import { FlightStatus, FlightRecord } from "@/types/flight";
import { IFlightProvider } from "../types";

interface AviationStackFlight {
  flight: {
    iata: string | null;
    icao: string | null;
    number: string | null;
  };
  airline: {
    name: string | null;
    iata: string | null;
  };
  departure: {
    iata: string | null;
    icao: string | null;
    scheduled: string | null;
    actual: string | null;
    delay: number | null;
  };
  arrival: {
    iata: string | null;
    icao: string | null;
    estimated: string | null;
    scheduled: string | null;
    actual: string | null;
  };
  flight_status: string | null;
  flight_date: string | null;
  aircraft: {
    registration: string | null;
    icao24: string | null;
  } | null;
}

export class AviationStackAdapter implements IFlightProvider {
  name = "AviationStack";
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async fetchFlightsByAirport(iata: string): Promise<FlightRecord[]> {
    try {
      const response = await axios.get(
        "http://api.aviationstack.com/v1/flights",
        {
          params: {
            access_key: this.apiKey,
            dep_iata: iata,
            limit: 100,
          },
          timeout: 10000,
        },
      );

      const data = (response.data.data as AviationStackFlight[]) || [];
      return this.mapRecords(data);
    } catch (error) {
      console.error(`[AviationStackAdapter] Error matching ${iata}:`, error);
      throw error;
    }
  }

  async fetchFlightsByNumber(flightNum: string): Promise<FlightRecord[]> {
    try {
      const response = await axios.get(
        "http://api.aviationstack.com/v1/flights",
        {
          params: {
            access_key: this.apiKey,
            flight_iata: flightNum,
            limit: 10,
          },
          timeout: 10000,
        },
      );

      const data = (response.data.data as AviationStackFlight[]) || [];
      return this.mapRecords(data);
    } catch (error) {
      console.error(
        `[AviationStackAdapter] Error fetching flight ${flightNum}:`,
        error,
      );
      return [];
    }
  }

  private mapRecords(data: AviationStackFlight[]): FlightRecord[] {
    return data
      .map((flight) => {
        const flightNum =
          flight.flight.iata ||
          flight.flight.icao ||
          flight.flight.number ||
          "UNKNOWN";
        const airline =
          flight.airline.name || flight.airline.iata || "Unknown Airline";
        const origin =
          flight.departure.iata || flight.departure.icao || "UNKNOWN";

        const arrivalEstimated =
          flight.arrival.estimated || flight.arrival.scheduled || null;
        const arrivalActual = flight.arrival.actual || null;
        const departureActual = flight.departure.actual || null;
        const departureScheduled = flight.departure.scheduled || null;

        let status = (
          flight.flight_status || FlightStatus.UNKNOWN
        ).toLowerCase();

        // Fallback logic for status
        if (arrivalActual) {
          status = FlightStatus.LANDED;
        } else if (status === FlightStatus.UNKNOWN || !flight.flight_status) {
          if (departureActual) {
            status = FlightStatus.ACTIVE;
          } else if (departureScheduled) {
            const isFuture =
              new Date(departureScheduled).getTime() > Date.now();
            status = isFuture ? FlightStatus.SCHEDULED : FlightStatus.ACTIVE;
          }
        }

        const flightDate =
          flight.flight_date ||
          (departureScheduled && departureScheduled.split("T")[0]) ||
          new Date().toISOString().split("T")[0];

        let delayMinutes = flight.departure.delay || 0;
        if (departureScheduled && departureActual) {
          const scheduledTime = new Date(departureScheduled).getTime();
          const actualTime = new Date(departureActual).getTime();
          delayMinutes = Math.max(
            0,
            Math.round((actualTime - scheduledTime) / 60000),
          );
        }

        const arrivalIata =
          flight.arrival.iata || flight.arrival.icao || "UNKNOWN";

        return {
          flight_num: flightNum,
          airline: airline,
          origin: origin,
          status: status as FlightStatus,
          delay_minutes: delayMinutes,
          captured_at: new Date().toISOString(),
          flight_date: flightDate,
          arrival_estimated: arrivalEstimated,
          arrival_actual: arrivalActual,
          departure_scheduled: departureScheduled,
          arrival_iata: arrivalIata,
          is_system_closed: false,
          tail_number: flight.aircraft?.registration || null,
          icao24: flight.aircraft?.icao24 || null,
        } as FlightRecord;
      })
      .filter(
        (record: FlightRecord) =>
          record.flight_num !== "UNKNOWN" &&
          record.origin !== "UNKNOWN" &&
          record.arrival_iata !== "UNKNOWN",
      );
  }
}
