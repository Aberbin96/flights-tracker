import { VerificationService } from "../services/flight/verificationService";

async function verifyFlights() {
  console.log("Starting automated flight verification...");
  try {
    const verificationService = new VerificationService();
    const result = await verificationService.runAutoVerification();
    console.log(
      `Live verification completed. Processed: ${result.processedCount}, Updated: ${result.updatedCount}`,
    );
    if (result.logs && result.logs.length > 0) {
      console.log("Logs:");
      result.logs.forEach((log) => console.log(` - ${JSON.stringify(log)}`));
    }
  } catch (error) {
    console.error("Global Verification Error:", error);
    process.exit(1);
  }
}

verifyFlights().catch(console.error);
