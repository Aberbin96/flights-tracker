import { NextResponse } from "next/server";
import { FlightService } from "@/services/flight/flightService";
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

    const airportsToSync = targetAirport ? [targetAirport] : TRACKED_AIRPORTS;

    for (const airport of airportsToSync) {
      console.log(`[Sync] Starting sync for ${airport}...`);
      const result = await flightService.syncAirport(airport);
      if (result.success) {
        totalCount += result.count;
        result.providersUsed.forEach((p) => providersUsed.add(p));
      }
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    return NextResponse.json({
      message: "Sync successful",
      total_count: totalCount,
      providers_used: Array.from(providersUsed),
    });
  } catch (error: any) {
    console.error("[Sync] Global Error:", error);
    Sentry.captureException(error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
