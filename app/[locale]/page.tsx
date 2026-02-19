import { supabase } from "@/utils/supabase/client";
import { FlightRecord } from "@/types/flight";
import { Header } from "@/components/Header";
import { SummaryDashboard } from "@/components/SummaryDashboard";
import { AirlinePerformance } from "@/components/AirlinePerformance";
import { RecentMovements } from "@/components/RecentMovements";

export const dynamic = "force-dynamic";

// Updated fetch function with filters
async function getRecentFlights(airline?: string, date?: string) {
  let query = supabase
    .from("flights_history")
    .select("*")
    .order("captured_at", { ascending: false });

  if (airline) {
    query = query.ilike("airline", `%${airline}%`);
  }

  if (date) {
    query = query.eq("flight_date", date);
  } else {
    // Increased limit for better stats
    query = query.limit(50);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching flights:", error);
    return [];
  }
  return data as FlightRecord[];
}

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function Home({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;

  const airlineFilter =
    typeof resolvedSearchParams.airline === "string"
      ? resolvedSearchParams.airline
      : undefined;
  const dateFilter =
    typeof resolvedSearchParams.date === "string"
      ? resolvedSearchParams.date
      : undefined;

  const filteredFlights = await getRecentFlights(airlineFilter, dateFilter);

  // Basic Stats Calculation
  const totalShown = filteredFlights.length;
  const delayed = filteredFlights.filter((f) => f.delay_minutes > 15).length;
  const cancelled = filteredFlights.filter(
    (f) => f.status === "cancelled" || f.status === "Cancelled",
  ).length;

  const punctuality = totalShown > 0
    ? Math.round(((totalShown - delayed - cancelled) / totalShown) * 100)
    : 100;

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 min-h-screen">
      <Header />
      <main className="p-4 space-y-6 max-w-md mx-auto">
        <SummaryDashboard
          totalFlights={totalShown}
          punctuality={punctuality}
          delays={delayed}
          cancellations={cancelled}
        />
        <AirlinePerformance flights={filteredFlights} />
        <RecentMovements flights={filteredFlights} />
      </main>

      {/* Map Preview Placeholder as per design */}
      <div className="hidden">
        <img
            alt="Map of Venezuela showing air routes"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAuRDuGay_OniG8jb4e-ZBVq94f1Ga4mPQ7EYXGCl9R_JCm5yNqgBlXOaEE5_0nE6kd7Qy7sc-blszWH_whlPwTw6lJBUVSjcLb2Em-HuDsa8ISRdQjWRLK3UBpQND9rpXcbr5VWSkY2nV0x1NUaIGkUWN0MAB5gYsoaglnrOQJLR67X7fiIDMGqsY0c5iDZaaBTyEGT0vx-PPkm4jjoXJN-lw8IUgrouXekjR-jjzW8QQsL9ScSrqag-W1MaGthBr3qV9jGUq3zcBl"
        />
      </div>
    </div>
  );
}
