"use client";

import { TrendingUp, TrendingDown } from "lucide-react";

interface SummaryDashboardProps {
  totalFlights: number;
  punctuality: number;
  delays: number;
  cancellations: number;
}

export function SummaryDashboard({
  totalFlights,
  punctuality,
  delays,
  cancellations,
}: SummaryDashboardProps) {
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Live Summary
        </h2>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {/* Total Flights */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Total Flights
          </p>
          <div className="flex items-end justify-between mt-1">
            <span className="text-2xl font-bold">{totalFlights}</span>
            <span className="text-emerald-500 text-xs font-bold flex items-center mb-1">
              <TrendingUp className="w-3 h-3 mr-0.5" /> 5%
            </span>
          </div>
        </div>

        {/* Punctuality */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Punctuality
          </p>
          <div className="flex items-end justify-between mt-1">
            <span className="text-2xl font-bold">{punctuality}%</span>
            <span className="text-rose-500 text-xs font-bold flex items-center mb-1">
              <TrendingDown className="w-3 h-3 mr-0.5" /> 2%
            </span>
          </div>
        </div>

        {/* Delays */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Delays
          </p>
          <div className="flex items-end justify-between mt-1">
            <span className="text-2xl font-bold text-amber-500">{delays}</span>
            <span className="text-slate-400 text-[10px] mb-1">Last 24h</span>
          </div>
        </div>

        {/* Cancellations */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Cancellations
          </p>
          <div className="flex items-end justify-between mt-1">
            <span className="text-2xl font-bold text-rose-500">
              {cancellations}
            </span>
            <span className="text-slate-400 text-[10px] mb-1">Today</span>
          </div>
        </div>
      </div>
      <p className="text-center text-[10px] text-slate-400 mt-3 italic">
        Last updated: Just now via SVMI Tower
      </p>
    </section>
  );
}
