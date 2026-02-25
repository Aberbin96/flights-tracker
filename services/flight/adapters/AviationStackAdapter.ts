import axios from "axios";
import { FlightStatus, FlightRecord } from "@/types/flight";
import { IFlightProvider } from "../types";

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

      const data = response.data.data || [];
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

      const data = response.data.data || [];
      return this.mapRecords(data);
    } catch (error) {
      console.error(
        `[AviationStackAdapter] Error fetching flight ${flightNum}:`,
        error,
      );
      return [];
    }
  }

  private mapRecords(data: unknown[]): FlightRecord[] {
    return data
      .map((flight: any) => {
        const flightNum =
          flight.flight.iata ||
          flight.flight.icao ||
          flight.flight.number ||
          "UNKNOWN";
        const airline =
          flight.airline.name || flight.airline.iata || "Unknown Airline";
        const origin =
          flight.departure.iata || flight.departure.icao || "UNKNOWN";

        let status = (
          flight.flight_status || FlightStatus.UNKNOWN
        ).toLowerCase();

        const flightDate =
          flight.flight_date ||
          (flight.departure.scheduled &&
            flight.departure.scheduled.split("T")[0]) ||
          new Date().toISOString().split("T")[0];

        const arrivalEstimated =
          flight.arrival.estimated || flight.arrival.scheduled || null;
        const arrivalActual = flight.arrival.actual || null;

        if (arrivalActual) {
          status = FlightStatus.LANDED;
        }

        let delayMinutes = flight.departure.delay || 0;
        if (flight.departure.scheduled && flight.departure.actual) {
          const scheduledTime = new Date(flight.departure.scheduled).getTime();
          const actualTime = new Date(flight.departure.actual).getTime();
          delayMinutes = Math.max(
            0,
            Math.round((actualTime - scheduledTime) / 60000),
          );
        }

        const departureScheduled = flight.departure.scheduled || null;
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
