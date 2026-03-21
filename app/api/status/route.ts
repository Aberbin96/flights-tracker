import { NextResponse } from "next/server";
import { StatusService } from "@/services/flight/statusService";
import * as Sentry from "@sentry/nextjs";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const limits = await StatusService.getAllLimits();
    
    return NextResponse.json({
      success: true,
      service_status: limits,
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    console.error("[StatusAPI] Error:", error);
    Sentry.captureException(error);
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
