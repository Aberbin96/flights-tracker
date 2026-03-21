import { NextResponse } from "next/server";
import { VerificationService } from "@/services/flight/verificationService";
import * as Sentry from "@sentry/nextjs";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Security Check (reuse CRON_SECRET for simplicity)
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("[TestVerification] Starting manual verification run...");
    const verificationService = new VerificationService();
    const result = await verificationService.verifyStuckFlights();

    return NextResponse.json({
      message: "Verification run completed",
      verified_count: result.verifiedCount,
      verification_logs: result.logs,
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    console.error("[TestVerification] Error:", error);
    Sentry.captureException(error);
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
