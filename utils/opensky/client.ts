import axios from "axios";

// OpenSky Network API
// Docs: https://openskynetwork.github.io/opensky-api/rest.html

const OPENSKY_API_URL = "https://opensky-network.org/api";

export interface OpenSkyState {
  icao24: string;
  callsign: string;
  origin_country: string;
  time_position: number | null;
  last_contact: number;
  longitude: number | null;
  latitude: number | null;
  baro_altitude: number | null;
  on_ground: boolean;
  velocity: number | null;
  true_track: number | null;
  vertical_rate: number | null;
  sensors: number[] | null;
  geo_altitude: number | null;
  squawk: string | null;
  spi: boolean;
  position_source: number;
}

export class OpenSkyClient {
  /**
   * Fetch all states. Optionally filter by bounding box to reduce data.
   * Using Venezuela/Caribbean rough bounds:
   * Lat: 0 to 14
   * Lon: -74 to -59
   */
  static async getFlightsInVenezuela(): Promise<OpenSkyState[]> {
    try {
      // Bounding box for Venezuela/Caribbean region to minimize data
      const lamin = 0;
      const lomin = -75;
      const lamax = 14;
      const lomax = -58;

      const url = `${OPENSKY_API_URL}/states/all?lamin=${lamin}&lomin=${lomin}&lamax=${lamax}&lomax=${lomax}`;

      const response = await axios.get(url, {
        timeout: 5000, // Short timeout
      });

      if (!response.data || !response.data.states) {
        return [];
      }

      // Map raw array to object
      // Index 0: icao24, 1: callsign, ...
      return response.data.states.map((s: any[]) => ({
        icao24: s[0],
        callsign: s[1].trim(),
        origin_country: s[2],
        time_position: s[3],
        last_contact: s[4],
        longitude: s[5],
        latitude: s[6],
        baro_altitude: s[7],
        on_ground: s[8],
        velocity: s[9],
        true_track: s[10],
        vertical_rate: s[11],
        sensors: s[12],
        geo_altitude: s[13],
        squawk: s[14],
        spi: s[15],
        position_source: s[16],
      }));
    } catch (error) {
      console.warn(
        "OpenSky API failed:",
        error instanceof Error ? error.message : "Unknown error",
      );
      return [];
    }
  }

  /**
   * Check if a specific callsign is currently airborne in the region.
   */
  static async verifyFlightActive(
    callsign: string,
    regionStates?: OpenSkyState[],
  ): Promise<boolean> {
    const states = regionStates || (await this.getFlightsInVenezuela());

    // Callsigns in OpenSky are often padded with spaces or have minor variations.
    // We try to match loosely.
    const normalizedTarget = callsign.replace(/\s/g, "").toUpperCase();

    const match = states.find((s) => {
      const normalizedSource = s.callsign.replace(/\s/g, "").toUpperCase();
      return (
        normalizedSource === normalizedTarget ||
        normalizedSource.includes(normalizedTarget)
      );
    });

    if (match) {
      // If it's on the ground, it's not "Active" in the air, but it IS tracked.
      // For our purpose (ghost flight detection), if we see it, it exists.
      return true;
    }

    return false;
  }
}
