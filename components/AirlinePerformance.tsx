"use client";

import { FlightRecord, FlightStatus } from "@/types/flight";
import { Plane, Info } from "lucide-react";

interface AirlinePerformanceProps {
  flights: FlightRecord[];
}

export function AirlinePerformance({ flights }: AirlinePerformanceProps) {
  // Group flights by airline
  const grouped = flights.reduce((acc, flight) => {
    const airline = flight.airline || "Unknown";
    if (!acc[airline]) {
      acc[airline] = [];
    }
    acc[airline].push(flight);
    return acc;
  }, {} as Record<string, FlightRecord[]>);

  // Sort airlines by flight count (descending) and take top 3
  const topAirlines = Object.entries(grouped)
    .sort(([, a], [, b]) => b.length - a.length)
    .slice(0, 3);

  const getStatusColor = (status: string, delay: number) => {
    if (status === FlightStatus.CANCELLED) return "text-rose-500";
    if (delay > 15) return "text-amber-500";
    return "text-emerald-500";
  };

  const getAirlineStatus = (flights: FlightRecord[]) => {
      const delays = flights.filter(f => f.delay_minutes > 15).length;
      const cancels = flights.filter(f => f.status === FlightStatus.CANCELLED).length;

      if (cancels > 0) return { label: "Issues", color: "text-rose-600 bg-rose-50 dark:bg-rose-900/30 dark:text-rose-400" };
      if (delays > 0) return { label: "Delays", color: "text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400" };
      return { label: "Active", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400" };
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Airlines Performance
        </h2>
      </div>
      <div className="space-y-3">
        {topAirlines.map(([airline, airlineFlights]) => {
            const status = getAirlineStatus(airlineFlights);
            return (
              <div
                key={airline}
                className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-bold">{airline}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.color}`}>
                    {status.label}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {airlineFlights.slice(0, 10).map((flight, idx) => (
                    <Plane
                      key={flight.id || idx}
                      className={`w-4 h-4 ${getStatusColor(
                        flight.status as string,
                        flight.delay_minutes
                      )}`}
                    />
                  ))}
                </div>
              </div>
            );
        })}
      </div>
      <div className="mt-2 flex items-center gap-2 px-1">
        <Info className="text-slate-400 w-4 h-4" />
        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
          Icons represent individual flight status. Tap on status icons to view
          tooltips with specific flight details.
        </p>
      </div>
    </section>
  );
}
