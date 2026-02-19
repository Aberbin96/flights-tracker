"use client";

import { FlightRecord, FlightStatus } from "@/types/flight";
import { ArrowRight } from "lucide-react";

interface RecentMovementsProps {
  flights: FlightRecord[];
}

export function RecentMovements({ flights }: RecentMovementsProps) {

  const getStatusColor = (status: string, delay: number) => {
    const s = status.toLowerCase();
    if (s === "landed") return "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400";
    if (s === "cancelled") return "bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400";
    if (s === "active" || s === "in air") return "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300";
    if (delay > 15 || s === "delayed") return "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400";
    return "bg-slate-50 text-slate-600 dark:bg-slate-900/30 dark:text-slate-400";
  };

  const getStatusLabel = (flight: FlightRecord) => {
      const s = flight.status.toString().toLowerCase();
      if (s === "landed") return "Landed";
      if (s === "cancelled") return "Cancelled";
      if (s === "active") return "In Air";
      if (flight.delay_minutes > 15) return "Delayed";
      return flight.status;
  };

  const formatTime = (dateStr?: string | null) => {
    if (!dateStr) return "";
    try {
        // If it's already a time string like "14:20", return it.
        // If it's ISO, parse it.
        if (dateStr.includes("T")) {
             const date = new Date(dateStr);
             return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        }
        return dateStr;
    } catch (e) {
      return "";
    }
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Recent Movements
        </h2>
        <button className="text-xs text-primary dark:text-white font-bold flex items-center gap-1">
          See All <ArrowRight className="w-3 h-3" />
        </button>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {flights.map((flight) => (
            <div key={flight.id} className="flex items-center justify-between p-4">
              <div className="flex flex-col">
                <span className="text-sm font-bold">{flight.flight_num}</span>
                <span className="text-[10px] text-slate-400 uppercase font-medium">
                  {flight.airline}
                </span>
              </div>
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold">{flight.origin}</span>
                  {/* Destination is missing in types */}
                </div>
                <span className="text-[10px] text-slate-400">
                  {flight.departure_scheduled ? `Sched: ${formatTime(flight.departure_scheduled)}` : (flight.arrival_actual ? `Arr: ${formatTime(flight.arrival_actual)}` : '')}
                </span>
              </div>
              <div className="text-right">
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${getStatusColor(
                    flight.status as string,
                    flight.delay_minutes
                  )}`}
                >
                  {getStatusLabel(flight)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
