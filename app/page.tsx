import { supabase } from "@/utils/supabase/client";
import { FlightCard } from "./components/FlightCard";
import { Leaderboard } from "./components/Leaderboard";
import { CancellationChart } from "./components/CancellationChart";
import { FlightRecord } from "./types/flight";
import { AlertCircle, Plane } from "lucide-react";
import { ShareButton } from "./components/ShareButton";

export const dynamic = "force-dynamic";

async function getRecentFlights() {
  const { data, error } = await supabase
    .from("flights_history")
    .select("*")
    .order("captured_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("Error fetching flights:", error);
    return [];
  }
  return data as FlightRecord[];
}

export default async function Home() {
  const recentFlights = await getRecentFlights();

  // Basic Stats Calculation (from recent batch)
  const totalShown = recentFlights.length;
  const delayed = recentFlights.filter((f) => f.delay_minutes > 15).length;
  const cancelled = recentFlights.filter(
    (f) => f.status === "cancelled",
  ).length;

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 p-6 md:p-12 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              VueloTransparente 🇻🇪
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1">
              Real-time flight transparency tracker for Venezuela.
            </p>
          </div>
          <div className="flex gap-2">
            <ShareButton />
            <button className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-md font-medium text-sm transition-opacity hover:opacity-90">
              Refresh Data
            </button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
                <Plane size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  Recent Flights
                </p>
                <p className="text-2xl font-bold">{totalShown}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full text-red-600 dark:text-red-400">
                <AlertCircle size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  Significant Delays
                </p>
                <p className="text-2xl font-bold">{delayed}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full text-orange-600 dark:text-orange-400">
                <AlertCircle size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  Cancellations
                </p>
                <p className="text-2xl font-bold">{cancelled}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Dash Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Feed */}
          <section className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Latest Updates</h2>
              <span className="text-xs text-zinc-500 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full animate-pulse">
                • Live
              </span>
            </div>

            <div className="space-y-4">
              {recentFlights.length > 0 ? (
                recentFlights.map((flight) => (
                  <FlightCard
                    key={flight.captured_at + flight.flight_num}
                    flight={flight}
                  />
                ))
              ) : (
                <div className="p-8 text-center bg-zinc-100 dark:bg-zinc-900/50 rounded-lg text-zinc-500">
                  No flight data available. Check API sync.
                </div>
              )}
            </div>
          </section>

          {/* Sidebar */}
          <aside className="space-y-8">
            <section>
              <h2 className="text-xl font-semibold mb-4">
                Airline Leaderboard
              </h2>
              <Leaderboard />
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">Cancellation Trend</h2>
              <CancellationChart />
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
