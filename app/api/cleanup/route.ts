import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // 1. Security Check
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 2. Define "Stale" Threshold (e.g., 4 hours past estimated arrival)
    // We want to find flights that are 'active' but should have landed long ago.
    // Postgres interval syntax: NOW() - INTERVAL '4 hours'

    // 3. Update Stale Records
    const { data, error } = await supabaseAdmin
      .from("flights_history")
      .update({ status: "unknown" })
      .eq("status", "active")
      .lt(
        "arrival_estimated",
        new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      ) // 4 hours ago
      .select();

    if (error) {
      console.error("Cleanup Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      message: "Cleanup successful",
      updated_count: data.length,
      updated_records: data.map((f) => f.flight_num),
    });
  } catch (error: any) {
    console.error("Cleanup Unexpected Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
