export interface GeoCoordinates {
  lat: number;
  lng: number;
}

export const AIRPORT_COORDINATES: Record<string, GeoCoordinates & { icao: string }> = {
  CCS: { lat: 10.6012, lng: -66.9912, icao: "SVMI" },
  MAR: { lat: 10.5638, lng: -71.7291, icao: "SVMC" },
  VLN: { lat: 10.1491, lng: -67.9275, icao: "SVVA" },
  PMV: { lat: 10.9125, lng: -63.9667, icao: "SVMG" },
  BRM: { lat: 10.0428, lng: -69.3585, icao: "SVBM" },
  PZO: { lat: 8.2868, lng: -62.7594, icao: "SVPR" },
};

/**
 * Distance in kilometers between two points using Haversine formula
 */
export function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}
