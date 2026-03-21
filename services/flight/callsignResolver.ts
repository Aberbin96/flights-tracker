/**
 * Maps IATA airline prefixes to ICAO airline codes.
 * Used for constructing callsigns for OpenSky lookups.
 */
const AIRLINE_MAPPINGS: Record<string, string> = {
  // Venezuela
  "V0": "VCV", // Conviasa
  "QL": "LER", // Laser
  "9V": "ROI", // Avior
  "5R": "RUC", // Rutaca
  "ES": "ETR", // Estelar
  "AW": "VNE", // Venezolana
  "J8": "TVL", // Albatros / Travel Air
  "PY": "SUR", // Surinam (sometimes flies to VZLA)
  "PU": "RSU", // Plus Ultra
  
  // Regional / Common
  "CM": "CMP", // Copa
  "LA": "LAN", // LATAM
  "AV": "AVA", // Avianca
  "H2": "SKU", // Sky Airline
};

/**
 * Resolves a potential callsign from a flight number.
 * Example: V03018 -> VCV3018
 */
export function resolveCallsign(flightNum: string): string | null {
  if (!flightNum || flightNum.length < 3) return null;

  // Extract IATA prefix (first 2 chars) and number
  const iataPrefix = flightNum.substring(0, 2).toUpperCase();
  const digits = flightNum.substring(2).replace(/\s+/g, "");
  
  const icaoPrefix = AIRLINE_MAPPINGS[iataPrefix];
  if (!icaoPrefix) return null;

  return `${icaoPrefix}${digits}`;
}
