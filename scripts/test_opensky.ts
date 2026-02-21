import { OpenSkyClient } from "../utils/opensky/client";

/**
 * Standalone script to test OpenSky Network integration.
 * Run with: npx tsx scripts/test_opensky.ts
 */
async function runTest() {
  try {
    const start = Date.now();
    const flights = await OpenSkyClient.getFlightsInVenezuela();
    const duration = Date.now() - start;

    if (flights.length > 0) {
      flights.slice(0, 5).forEach((f) => {});
    }

    // Verify a sample callsign if we have any
    if (flights.length > 0) {
      const sample = flights[0].callsign.trim();
      if (sample) {
        const exists = await OpenSkyClient.verifyFlightActive(sample, flights);
      }
    }
  } catch (error) {
    console.error("\n❌ Error fetching from OpenSky:", error);
  }
}

runTest();
