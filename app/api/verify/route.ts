import { NextResponse } from "next/server";
import { VerificationService } from "@/services/flight/verificationService";
import * as Sentry from "@sentry/nextjs";

export const dynamic = "force-dynamic";

/**
 * Automated Live Verification Endpoint
 * 
 * GET /api/verify
 * 
 * This endpoint is triggered every 20 minutes by GitHub Actions to detect
 * takeoffs, landings, and delays using OpenRadar/OpenSky data.
 * 
 * Authorization: Requires Bearer <CRON_SECRET> header.
 */
export async function GET(request: Request) {
  // Security Check (reuse CRON_SECRET)
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("[LiveVerification] Starting automated verification run...");
    const verificationService = new VerificationService();
    const result = await verificationService.runAutoVerification();

    return NextResponse.json({
      message: "Live verification completed",
      processed_count: result.processedCount,
      updated_count: result.updatedCount,
      logs: result.logs,
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    console.error("[LiveVerification] critical error:", error);
    Sentry.captureException(error);
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
