import { supabase } from "@/utils/supabase/client";
import { FlightRecord } from "@/types/flight";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { KPISection } from "@/components/KPISection";
import { AirlinePerformance, AirlineStats } from "@/components/AirlinePerformance";
import { FleetActivity } from "@/components/FleetActivity";
import { FlightTable } from "@/components/FlightTable";

export const dynamic = "force-dynamic";

// Fetch distinct origin airports for the filter
async function getAirports() {
  const { data, error } = await supabase
    .from("flights_history")
    .select("origin");

  if (error) return [];

  const uniqueOrigins = Array.from(new Set(data.map((item) => item.origin)))
    .filter(Boolean)
    .sort();
  return uniqueOrigins;
}

// Fetch min date for the calendar
async function getMinDate() {
  const { data, error } = await supabase
    .from("flights_history")
    .select("flight_date")
    .order("flight_date", { ascending: true })
    .limit(1);

  if (error || !data || data.length === 0) return "";
  return data[0].flight_date;
}

// Updated fetch function with filters
async function getRecentFlights(origin?: string, date?: string) {
  let query = supabase
    .from("flights_history")
    .select("*")
    .order("captured_at", { ascending: false });

  if (origin) {
    query = query.eq("origin", origin);
  }

  if (date) {
    query = query.eq("flight_date", date);
  } else {
    // Limit to recent flights, increased for dashboard view
    query = query.limit(50);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching flights:", error);
    return [];
  }
  return data as FlightRecord[];
}

// Fetch airline performance data
async function getLeaderboardData() {
  const { data, error } = await supabase
    .from("airline_delay_rankings")
    .select("*")
    .order("on_time_percentage", { ascending: false });

  if (error) {
    console.error("Error fetching leaderboard:", error);
    return [];
  }
  return data as AirlineStats[];
}

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function Home({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const resolvedSearchParams = await searchParams;

  const originFilter =
    typeof resolvedSearchParams.origin === "string"
      ? resolvedSearchParams.origin
      : undefined;
  const dateFilter =
    typeof resolvedSearchParams.date === "string"
      ? resolvedSearchParams.date
      : undefined;

  const flights = await getRecentFlights(originFilter, dateFilter);
  const airports = await getAirports();
  const minDate = await getMinDate();
  const performanceData = await getLeaderboardData();

  // Basic Stats Calculation based on fetched flights (or could be global if needed)
  const totalFlights = flights.length;
  const delayed = flights.filter((f) => f.delay_minutes > 15).length;
  const cancelled = flights.filter(
    (f) => String(f.status).toLowerCase() === "cancelled",
  ).length;

  // Punctuality: (Total - Delayed - Cancelled) / Total * 100
  // Note: Cancelled flights are not punctual. Delayed > 15 are not punctual.
  const onTimeCount = totalFlights - delayed - cancelled;
  const punctuality = totalFlights > 0 ? (onTimeCount / totalFlights) * 100 : 0;

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen flex flex-col font-display">
       <Header />
       <div className="flex flex-1 overflow-hidden">
          <Sidebar airports={airports} minDate={minDate} />
          <main className="flex-1 overflow-y-auto p-4 md:p-8">
             <KPISection
                totalFlights={totalFlights}
                punctuality={punctuality}
                delays={delayed}
                cancellations={cancelled}
             />

             <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
                 <AirlinePerformance data={performanceData} />
                 <FleetActivity flights={flights} />
             </div>

             <FlightTable flights={flights} />
          </main>
       </div>
    </div>
  );
}
