import axios from "axios";

/**
 * Hexdb.io API Adapter
 * Used for looking up aircraft registration (tail number) by ICAO24 hex code.
 */
export class HexdbAdapter {
  private baseUrl = "https://hexdb.io/api/v1";

  /**
   * Fetches aircraft registration for a given ICAO24 hex code.
   * @param hex ICAO24 address (6-character hex string)
   * @returns Registration string (tail number) or null
   */
  async getRegistration(hex: string): Promise<string | null> {
    try {
      if (!hex || hex.length !== 6) return null;

      console.log(`[HexdbAdapter] Looking up registration for ICAO24: ${hex}`);
      const response = await axios.get(`${this.baseUrl}/aircraft/${hex}`);

      if (response.data && response.data.Registration) {
        return response.data.Registration;
      }

      return null;
    } catch (error: any) {
      console.warn(
        `[HexdbAdapter] Failed to lookup hex ${hex}:`,
        error.response?.status || error.message,
      );
      return null;
    }
  }
}
