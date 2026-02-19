import { OpenSkyClient } from "../utils/opensky/client";

/**
 * Standalone script to test OpenSky Network integration.
 * Run with: npx tsx scripts/test_opensky.ts
 */
async function runTest() {
  console.log("📡 Connecting to OpenSky Network API...");
  console.log("📍 Region: Venezuela / Caribbean");

  try {
    const start = Date.now();
    const flights = await OpenSkyClient.getFlightsInVenezuela();
    const duration = Date.now() - start;

    console.log(
      `\n✅ Success! Fetched ${flights.length} flights in ${duration}ms.`,
    );

    if (flights.length > 0) {
      console.log("\nSample Flights:");
      flights.slice(0, 5).forEach((f) => {
        console.log(
          `✈️  ${f.callsign || "NO-CALLSIGN"} (ICAO: ${f.icao24}) - Alt: ${f.baro_altitude}m - Origin: ${f.origin_country}`,
        );
      });
    } else {
      console.log("\n⚠️  No flights found in the region right now.");
    }

    // Verify a sample callsign if we have any
    if (flights.length > 0) {
      const sample = flights[0].callsign.trim();
      if (sample) {
        console.log(`\n🔍 Verifying specific callsign: '${sample}'...`);
        const exists = await OpenSkyClient.verifyFlightActive(sample, flights);
        console.log(`   Result: ${exists ? "✅ VERIFIED" : "❌ NOT FOUND"}`);
      }
    }
  } catch (error) {
    console.error("\n❌ Error fetching from OpenSky:", error);
  }
}

runTest();
