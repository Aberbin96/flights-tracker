import { supabase } from "@/utils/supabase/client";
import { FlightRecord } from "@/types/flight";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { KPISection } from "@/components/KPISection";
import {
  AirlinePerformance,
  AirlineStats,
} from "@/components/AirlinePerformance";
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
    .order("captured_at", { ascending: false })
    .limit(3000);

  if (origin) {
    query = query.eq("origin", origin);
  }

  if (date) {
    query = query.eq("flight_date", date);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching flights:", error);
    return [];
  }
  return data as FlightRecord[];
}

// Fetch pre-aggregated global KPIs for the target date from the view
async function getDailyKpis(date: string) {
  const { data, error } = await supabase
    .from("daily_metrics_view")
    .select("*")
    .eq("flight_date", date);

  if (error) {
    console.error("Error fetching KPIs from view:", error);
    return { totalFlights: 0, punctuality: 0, delays: 0, cancellations: 0 };
  }

  const totalFlights = data.reduce(
    (sum, row) => sum + Number(row.total_flights || 0),
    0,
  );
  const delays = data.reduce(
    (sum, row) => sum + Number(row.delayed_flights || 0),
    0,
  );
  const cancellations = data.reduce(
    (sum, row) => sum + Number(row.cancelled_flights || 0),
    0,
  );
  const onTimeCount = data.reduce(
    (sum, row) => sum + Number(row.on_time_flights || 0),
    0,
  );
  const punctuality = totalFlights > 0 ? (onTimeCount / totalFlights) * 100 : 0;

  return { totalFlights, punctuality, delays, cancellations };
}

// Fetch pre-aggregated Airline Performance from the view
async function getAirlinePerformance(
  targetDate: string,
): Promise<AirlineStats[]> {
  const { data, error } = await supabase
    .from("airline_daily_performance_view")
    .select("*");

  if (error) {
    console.error("Error fetching airline performance from view:", error);
    return [];
  }

  const airlineMap = new Map<
    string,
    {
      totalFlights: number;
      totalOnTime: number;
      todayFlights: number;
      todayOnTime: number;
    }
  >();

  data.forEach((row) => {
    if (!airlineMap.has(row.airline)) {
      airlineMap.set(row.airline, {
        totalFlights: 0,
        totalOnTime: 0,
        todayFlights: 0,
        todayOnTime: 0,
      });
    }
    const stats = airlineMap.get(row.airline)!;

    stats.totalFlights += Number(row.total_flights || 0);
    stats.totalOnTime += Number(row.on_time_flights || 0);

    if (row.flight_date === targetDate) {
      stats.todayFlights += Number(row.total_flights || 0);
      stats.todayOnTime += Number(row.on_time_flights || 0);
    }
  });

  const performance: AirlineStats[] = [];
  airlineMap.forEach((stats, airline) => {
    if (stats.totalFlights > 0) {
      performance.push({
        airline,
        total_percentage: (stats.totalOnTime / stats.totalFlights) * 100,
        today_percentage:
          stats.todayFlights > 0
            ? (stats.todayOnTime / stats.todayFlights) * 100
            : 0,
      });
    }
  });

  return performance.sort((a, b) => b.total_percentage - a.total_percentage);
}

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function Home({ params, searchParams }: PageProps) {
  await params;
  const resolvedSearchParams = await searchParams;

  const originFilter =
    typeof resolvedSearchParams.origin === "string"
      ? resolvedSearchParams.origin
      : "CCS";
  const dateFilter =
    typeof resolvedSearchParams.date === "string"
      ? resolvedSearchParams.date
      : undefined;

  const currentCaracasDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Caracas",
  }).format(new Date());
  const effectiveTargetDate = dateFilter || currentCaracasDate;

  const [flights, airports, minDate, performanceData, kpiStats] =
    await Promise.all([
      getRecentFlights(originFilter, dateFilter),
      getAirports(),
      getMinDate(),
      getAirlinePerformance(effectiveTargetDate),
      getDailyKpis(effectiveTargetDate),
    ]);

  const {
    totalFlights,
    punctuality,
    delays,
    cancelled: cancellations,
  } = {
    ...kpiStats,
    cancelled: kpiStats.cancellations,
  };

  // Filter Fleet Activity strictly for "today" or the filtered date
  const fleetActivityFlights = flights.filter(
    (f) => f.flight_date === effectiveTargetDate,
  );

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen flex flex-col font-display">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar airports={airports} minDate={minDate} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <KPISection
            totalFlights={totalFlights}
            punctuality={punctuality}
            delays={delays}
            cancellations={cancellations}
          />

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
            <AirlinePerformance data={performanceData} />
            <FleetActivity flights={fleetActivityFlights} />
          </div>

          <FlightTable flights={flights} />
        </main>
      </div>
    </div>
  );
}
