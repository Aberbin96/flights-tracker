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
  flight_num: string;
  airline: string;
  origin: string;
  status: FlightStatus | string;
  delay_minutes: number;
  captured_at: string;
}
