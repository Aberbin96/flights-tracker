
import { supabaseAdmin } from "./utils/supabase/admin";

async function checkYesterday() {
  const yesterday = "2026-04-03";
  const { data, error } = await supabaseAdmin
    .from("flights_history")
    .select("status, count")
    .eq("flight_date", yesterday);
    
  if (error) {
    console.error(error);
    return;
  }

  const stats = data.reduce((acc: any, row: any) => {
    acc[row.status] = (acc[row.status] || 0) + 1;
    return acc;
  }, {});

  console.log(`Stats for ${yesterday}:`, stats);
  
  const { data: stuck } = await supabaseAdmin
    .from("flights_history")
    .select("flight_num, departure_scheduled, status")
    .eq("flight_date", yesterday)
    .in("status", ["scheduled", "active", "unknown"])
    .limit(10);
    
  console.log("Samples of stuck flights:", stuck);
}

checkYesterday();
