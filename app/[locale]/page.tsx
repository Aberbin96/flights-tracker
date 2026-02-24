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
import {
  CARGO_AIRLINES,
  VZLA_IATA,
  PUBLIC_AIRLINES,
} from "@/constants/flights";

export const dynamic = "force-dynamic";

// Fetch distinct origin airports for the filter using the view
async function getAirports() {
  const { data, error } = await supabase
    .from("distinct_airports_view")
    .select("origin");

  if (error) {
    console.error("Error fetching airports from view:", error);
    return [];
  }

  return data.map((item) => item.origin);
}

// Fetch distinct airlines for the filter using the view
async function getAirlines() {
  const { data, error } = await supabase
    .from("distinct_airlines_view")
    .select("airline");

  if (error) {
    console.error("Error fetching airlines from view:", error);
    return [];
  }

  return data.map((item) => item.airline);
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

// Helper to apply common filters to any query targeting flights or views
function applyFiltersToQuery(
  query: any,
  {
    origin,
    airline,
    companyType,
    national,
    international,
  }: {
    origin?: string;
    airline?: string;
    companyType?: string;
    national?: string;
    international?: string;
  },
) {
  let filteredQuery = query;
  if (origin) filteredQuery = filteredQuery.eq("origin", origin);
  if (airline) filteredQuery = filteredQuery.eq("airline", airline);

  // Cargo/Private Airlines Heuristic
  if (companyType === "commercial") {
    const formattedAirlines = `(${CARGO_AIRLINES.map((a) => `"${a}"`).join(",")})`;
    filteredQuery = filteredQuery.not("airline", "in", formattedAirlines);
  } else if (companyType === "cargo") {
    filteredQuery = filteredQuery.in("airline", CARGO_AIRLINES);
  } else if (companyType === "public") {
    filteredQuery = filteredQuery.in("airline", PUBLIC_AIRLINES);
  } else if (companyType === "private") {
    const allPublicAndCargo = [...PUBLIC_AIRLINES, ...CARGO_AIRLINES];
    const formattedAirlines = `(${allPublicAndCargo.map((a) => `"${a}"`).join(",")})`;
    filteredQuery = filteredQuery.not("airline", "in", formattedAirlines);
  }

  // Domestic vs International Heuristic
  if (national === "false" && international !== "false") {
    const formattedIata = `(${VZLA_IATA.map((a) => `"${a}"`).join(",")})`;
    filteredQuery = filteredQuery.not("arrival_iata", "in", formattedIata);
  } else if (international === "false" && national !== "false") {
    filteredQuery = filteredQuery.in("arrival_iata", VZLA_IATA);
  }

  return filteredQuery;
}

// Updated fetch function with filters and server-side pagination
const PAGE_SIZE = 20;

async function getRecentFlights(
  page: number = 1,
  origin?: string,
  date?: string,
  airline?: string,
  companyType?: string,
  national?: string,
  international?: string,
) {
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("flights_history")
    .select(
      "id, flight_num, airline, origin, status, delay_minutes, captured_at, flight_date, departure_scheduled, arrival_iata, is_system_closed",
      { count: "exact" },
    )
    .order("flight_date", { ascending: false })
    .order("departure_scheduled", { ascending: false })
    .order("captured_at", { ascending: false })
    .range(from, to);

  if (date) query = query.eq("flight_date", date);

  query = applyFiltersToQuery(query, {
    origin,
    airline,
    companyType,
    national,
    international,
  });

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching flights:", error);
    return { data: [] as FlightRecord[], count: 0 };
  }
  return { data: (data ?? []) as FlightRecord[], count: count ?? 0 };
}

// Fetch all flights for a specific date (for Fleet Activity)
async function getFlightsByDate(
  date: string,
  origin?: string,
  airline?: string,
  companyType?: string,
  national?: string,
  international?: string,
) {
  let query = supabase
    .from("flights_history")
    .select(
      "id, flight_num, airline, origin, status, delay_minutes, captured_at, flight_date, departure_scheduled, arrival_iata, is_system_closed",
    )
    .eq("flight_date", date)
    .order("departure_scheduled", { ascending: false })
    .limit(1000);

  query = applyFiltersToQuery(query, {
    origin,
    airline,
    companyType,
    national,
    international,
  });

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching flights by date:", error);
    return [];
  }
  return data as FlightRecord[];
}

// Fetch pre-aggregated global KPIs for the target date from the view
async function getDailyKpis(
  date: string,
  origin?: string,
  airline?: string,
  companyType?: string,
  national?: string,
  international?: string,
) {
  let query = supabase
    .from("daily_metrics_view")
    .select("*")
    .eq("flight_date", date);

  query = applyFiltersToQuery(query, {
    origin,
    airline,
    companyType,
    national,
    international,
  });

  const { data, error } = await query;

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
  origin?: string,
  airline?: string,
  companyType?: string,
  national?: string,
  international?: string,
): Promise<AirlineStats[]> {
  let query = supabase.from("airline_daily_performance_view").select("*");

  query = applyFiltersToQuery(query, {
    origin,
    airline,
    companyType,
    national,
    international,
  });

  const { data, error } = await query;

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
        today_flights: stats.todayFlights,
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
    typeof resolvedSearchParams.origin === "string" &&
    resolvedSearchParams.origin !== ""
      ? resolvedSearchParams.origin
      : undefined;
  const dateFilter =
    typeof resolvedSearchParams.date === "string"
      ? resolvedSearchParams.date
      : undefined;

  const airlineFilter =
    typeof resolvedSearchParams.airline === "string"
      ? resolvedSearchParams.airline
      : undefined;
  const companyTypeFilter =
    typeof resolvedSearchParams.companyType === "string"
      ? resolvedSearchParams.companyType
      : undefined;
  const nationalFilter =
    typeof resolvedSearchParams.national === "string"
      ? resolvedSearchParams.national
      : undefined;
  const internationalFilter =
    typeof resolvedSearchParams.international === "string"
      ? resolvedSearchParams.international
      : undefined;
  const pageFilter = Math.max(
    1,
    parseInt(
      typeof resolvedSearchParams.page === "string"
        ? resolvedSearchParams.page
        : "1",
      10,
    ),
  );

  const currentCaracasDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Caracas",
  }).format(new Date());
  const effectiveTargetDate = dateFilter || currentCaracasDate;

  const [
    { data: recentFlights, count: totalFlightsCount },
    dayFlights,
    airports,
    airlines,
    minDate,
    performanceData,
    kpiStats,
  ] = await Promise.all([
    getRecentFlights(
      pageFilter,
      originFilter,
      dateFilter,
      airlineFilter,
      companyTypeFilter,
      nationalFilter,
      internationalFilter,
    ),
    getFlightsByDate(
      effectiveTargetDate,
      originFilter,
      airlineFilter,
      companyTypeFilter,
      nationalFilter,
      internationalFilter,
    ),
    getAirports(),
    getAirlines(),
    getMinDate(),
    getAirlinePerformance(
      effectiveTargetDate,
      originFilter,
      airlineFilter,
      companyTypeFilter,
      nationalFilter,
      internationalFilter,
    ),
    getDailyKpis(
      effectiveTargetDate,
      originFilter,
      airlineFilter,
      companyTypeFilter,
      nationalFilter,
      internationalFilter,
    ),
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

  // Fleet Activity uses the full day's data
  const fleetActivityFlights = dayFlights;

  return (
    <div className="bg-background-light dark:bg-background-dark h-[100dvh] flex flex-col font-display">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar airports={airports} airlines={airlines} minDate={minDate} />
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

          <FlightTable
            flights={recentFlights}
            totalCount={totalFlightsCount}
            currentPage={pageFilter}
            pageSize={20}
          />
        </main>
      </div>
    </div>
  );
}
