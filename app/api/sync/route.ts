import { NextResponse } from "next/server";
import { FlightService } from "@/services/flight/flightService";
import { VerificationService } from "@/services/flight/verificationService";
import { AviationStackAdapter } from "@/services/flight/adapters/AviationStackAdapter";
import { AeroDataBoxAdapter } from "@/services/flight/adapters/AeroDataBoxAdapter";
import { TRACKED_AIRPORTS } from "@/constants/flights";
import * as Sentry from "@sentry/nextjs";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // 1. Security Check
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const targetAirport = searchParams.get("airport")?.toUpperCase();

  try {
    const providers = [];
    if (process.env.AVIATION_API_KEY) {
      providers.push(new AviationStackAdapter(process.env.AVIATION_API_KEY));
    }
    if (process.env.AERODATABOX_API_KEY) {
      providers.push(new AeroDataBoxAdapter(process.env.AERODATABOX_API_KEY));
    }

    if (providers.length === 0) {
      return NextResponse.json(
        { error: "No API providers configured" },
        { status: 500 },
      );
    }

    const flightService = new FlightService(providers);
    let totalCount = 0;
    const providersUsed = new Set<string>();
    const allFailedProviders: Record<string, string> = {};

    const airportsToSync = targetAirport ? [targetAirport] : TRACKED_AIRPORTS;

    for (const airport of airportsToSync) {
      console.log(`[Sync] Starting sync for ${airport}...`);
      const result = await flightService.syncAirport(airport);
      
      if (result.success) {
        totalCount += result.count;
        result.providersUsed.forEach((p) => providersUsed.add(p));
      }
      
      if (result.failedProviders) {
        Object.assign(allFailedProviders, result.failedProviders);
      }

      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    // 3. Run Advanced Verification
    let verifiedCount = 0;
    try {
      const verificationService = new VerificationService();
      const verifyResult = await verificationService.verifyStuckFlights();
      verifiedCount = verifyResult.verifiedCount;
    } catch (vError) {
      console.error("[Sync] Verification failed:", vError);
      Sentry.captureException(vError);
    }

    return NextResponse.json({
      message: totalCount > 0 ? "Sync successful" : "Sync completed (no new data)",
      total_count: totalCount,
      verified_count: verifiedCount,
      providers_used: Array.from(providersUsed),
      failed_providers: Object.keys(allFailedProviders).length > 0 ? allFailedProviders : undefined,
    });
  } catch (error: unknown) {
    console.error("[Sync] Global Error:", error);
    Sentry.captureException(error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
