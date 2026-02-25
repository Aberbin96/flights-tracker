import { FlightRecord } from "@/types/flight";

export interface IFlightProvider {
  name: string;
  fetchFlightsByAirport(iata: string): Promise<FlightRecord[]>;
  fetchFlightsByNumber(flightNum: string): Promise<FlightRecord[]>;
}

export interface FlightServiceOptions {
  providers: IFlightProvider[];
}
