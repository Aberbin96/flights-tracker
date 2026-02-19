import { supabase } from "@/utils/supabase/client";
import { FlightCard } from "@/components/FlightCard";
import { Leaderboard } from "@/components/Leaderboard";
import { CancellationChart } from "@/components/CancellationChart";
import { FlightRecord } from "@/types/flight";
import { AlertCircle, Plane } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ShareButton } from "@/components/ShareButton";
import { FilterBar } from "@/components/FilterBar";
import { LocalClock } from "@/components/LocalClock";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

// Fetch distinct airlines for the filter
async function getAirlines() {
  const { data, error } = await supabase
    .from("flights_history")
    .select("airline");

  if (error) return [];

  // Extract unique airlines and sort them
  const uniqueAirlines = Array.from(new Set(data.map((item) => item.airline)))
    .filter(Boolean)
    .sort();
  return uniqueAirlines;
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
    // If no specific date filtered, limit to recent flights as before
    query = query.limit(20);
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

export default async function Home({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const resolvedSearchParams = await searchParams;

  const airlineFilter =
    typeof resolvedSearchParams.airline === "string"
      ? resolvedSearchParams.airline
      : undefined;
  const dateFilter =
    typeof resolvedSearchParams.date === "string"
      ? resolvedSearchParams.date
      : undefined;

  const t = await getTranslations("Index");
  const filteredFlights = await getRecentFlights(airlineFilter, dateFilter);
  const airlines = await getAirlines();
  const minDate = await getMinDate();

  // Basic Stats Calculation
  const totalShown = filteredFlights.length;
  const delayed = filteredFlights.filter((f) => f.delay_minutes > 15).length;
  const cancelled = filteredFlights.filter(
    (f) => f.status === "cancelled",
  ).length;

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 p-6 md:p-12 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {t("title")} 🇻🇪
            </h1>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-1">
              <p className="text-zinc-500 dark:text-zinc-400">
                {t("description")}
              </p>
              <LocalClock />
            </div>
            <div className="mt-2">
              <a
                href={`/${locale}/about`}
                className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 underline underline-offset-4"
              >
                {t("aboutLink", { fallback: "About this project" })}
              </a>
            </div>
          </div>
          <div className="flex gap-2">
            <LanguageSwitcher />
            <ShareButton />
            <a
              href="/"
              className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-md font-medium text-sm transition-opacity hover:opacity-90 flex items-center justify-center"
            >
              Refresh
            </a>
          </div>
        </header>

        {/* Filter Bar */}
        <FilterBar airlines={airlines} minDate={minDate} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Feed: Flight Cards */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Plane className="w-5 h-5" />
                {airlineFilter || dateFilter
                  ? `Search Results (${totalShown})`
                  : "Recent Flights"}
              </h2>
              <div className="flex gap-4 text-sm text-zinc-500">
                <span>
                  {t("delay")}:{" "}
                  <span className="font-bold text-red-500">{delayed}</span>
                </span>
                <span>
                  {t("statusCancelled")}:{" "}
                  <span className="font-bold text-red-500">{cancelled}</span>
                </span>
              </div>
            </div>

            {filteredFlights.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-zinc-400" />
                <p>No flights found matching your criteria.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredFlights.map((flight) => (
                  <FlightCard key={flight.id} flight={flight} />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar: Stats & Leaderboard */}
          <div className="space-y-8">
            <Leaderboard />
            <CancellationChart />
          </div>
        </div>
      </div>
    </main>
  );
}
