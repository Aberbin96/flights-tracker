import axios from "axios";

export interface OpenSkyState {
  icao24: string;
  callsign: string | null;
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
  category: number;
}

export class OpenSkyAdapter {
  private baseUrl = "https://opensky-network.org/api";

  /**
   * Fetches the current state of a specific aircraft by its ICAO24 address.
   */
  async fetchStateByIcao24(icao24: string): Promise<OpenSkyState | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/states/all`, {
        params: { icao24: icao24.toLowerCase() },
        timeout: 5000,
      });

      const states = response.data.states;
      if (!states || states.length === 0) return null;

      const s = states[0];
      return {
        icao24: s[0],
        callsign: s[1]?.trim() || null,
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
        category: s[17],
      };
    } catch (error) {
      console.warn(`[OpenSkyAdapter] Failed to fetch state for ${icao24}:`, error);
      return null;
    }
  }

  /**
   * Fetches the last known aircraft ICAO24 for a given callsign.
   * Useful for recovering missing icao24 from flight numbers.
   */
  async fetchLastIcao24ByCallsign(callsign: string): Promise<string | null> {
    const cleanCallsign = callsign.replace(/\s+/g, "").toUpperCase();
    const now = Math.floor(Date.now() / 1000);
    const sevenDaysAgo = now - 7 * 24 * 3600;

    const attemptLookup = async (cs: string) => {
      try {
        const response = await axios.get(`${this.baseUrl}/flights/callsign/${cs}`, {
          params: { begin: sevenDaysAgo, end: now },
          timeout: 8000
        });
        const flights = response.data;
        if (Array.isArray(flights) && flights.length > 0) {
          return flights[0].icao24 || null;
        }
      } catch (e) {
        return null;
      }
      return null;
    };

    // 1. Try exact match
    let icao24 = await attemptLookup(cleanCallsign);
    if (icao24) return icao24;

    // 2. Try zero-padding if it's < 4 digits (e.g. ROI78 -> ROI0078)
    const match = cleanCallsign.match(/^([A-Z]{3})(\d+)$/);
    if (match) {
      const prefix = match[1];
      const num = match[2];
      if (num.length < 4) {
        const paddedCallsign = `${prefix}${num.padStart(4, "0")}`;
        console.log(`[OpenSkyAdapter] Retrying with padded callsign: ${paddedCallsign}`);
        icao24 = await attemptLookup(paddedCallsign);
      }
    }

    return icao24;
  }

  /**
   * Fetches all aircraft states within a bounding box.
   * Useful for proximity-based flight discovery.
   */
  async fetchStatesInArea(
    latMin: number,
    lonMin: number,
    latMax: number,
    lonMax: number
  ): Promise<OpenSkyState[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/states/all`, {
        params: {
          lamin: latMin,
          lomin: lonMin,
          lamax: latMax,
          lomax: lonMax,
        },
        timeout: 8000,
      });

      const states = response.data.states;
      if (!states || !Array.isArray(states)) return [];

      return states.map((s: any) => ({
        icao24: s[0],
        callsign: s[1]?.trim() || null,
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
        category: s[17],
      }));
    } catch (error) {
      console.warn("[OpenSkyAdapter] Failed to fetch states in area:", error);
      return [];
    }
  }
}
