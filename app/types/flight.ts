export enum FlightStatus {
  SCHEDULED = "scheduled",
  ACTIVE = "active",
  LANDED = "landed",
  CANCELLED = "cancelled",
  INCIDENT = "incident",
  DIVERTED = "diverted",
  UNKNOWN = "unknown",
}

export interface FlightRecord {
  id?: number;
  flight_num: string;
  airline: string;
  origin: string;
  status: FlightStatus | string;
  delay_minutes: number;
  captured_at: string;
  flight_date: string;
  arrival_estimated?: string | null;
  arrival_actual?: string | null;
  departure_scheduled?: string | null;
}
