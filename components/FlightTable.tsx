"use client";

import { FlightRecord } from "@/types/flight";
import { useTranslations } from "next-intl";
import { useState } from "react";

interface FlightTableProps {
  flights: FlightRecord[];
}

export function FlightTable({ flights }: FlightTableProps) {
  const t = useTranslations("Dashboard");
  const [searchTerm, setSearchTerm] = useState("");

  // Helper to format time
  const formatTime = (dateStr?: string | null) => {
    if (!dateStr) return "--:--";
    try {
        const date = new Date(dateStr);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch {
        return "--:--";
    }
  };

  const calculateActualTime = (scheduled?: string | null, delay?: number) => {
    if (!scheduled) return "--:--";
    if (!delay) return formatTime(scheduled);
    try {
        const date = new Date(scheduled);
        date.setMinutes(date.getMinutes() + delay);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch {
        return "--:--";
    }
  };

  const filteredFlights = flights.filter(flight =>
     searchTerm === "" ||
     flight.flight_num.toLowerCase().includes(searchTerm.toLowerCase()) ||
     flight.airline.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="mt-8 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
            <h3 className="font-bold text-slate-900 dark:text-white w-full sm:w-auto">{t("detailedList")}</h3>
            <div className="relative w-full sm:w-64">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-lg">search</span>
                <input
                    className="w-full pl-10 pr-4 py-1.5 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20 text-slate-900 dark:text-slate-100"
                    placeholder={t("searchPlaceholder")}
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800/50">
                    <tr>
                        <th className="px-5 py-3 text-xs font-bold uppercase text-slate-500 tracking-wider">{t("flight")}</th>
                        <th className="px-5 py-3 text-xs font-bold uppercase text-slate-500 tracking-wider">{t("airline")}</th>
                        <th className="px-5 py-3 text-xs font-bold uppercase text-slate-500 tracking-wider">{t("route")}</th>
                        <th className="px-5 py-3 text-xs font-bold uppercase text-slate-500 tracking-wider">{t("status")}</th>
                        <th className="px-5 py-3 text-xs font-bold uppercase text-slate-500 tracking-wider">{t("progReal")}</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredFlights.map((flight, index) => {
                        let statusConfig = { text: t("onTime"), color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", dot: "bg-emerald-500" };

                        if (String(flight.status).toLowerCase() === 'cancelled') {
                             statusConfig = { text: t("cancelled"), color: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400", dot: "bg-rose-500" };
                        } else if (flight.delay_minutes > 15) {
                             statusConfig = { text: t("delayed"), color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", dot: "bg-amber-500" };
                        }

                        const scheduledTime = formatTime(flight.departure_scheduled);
                        const actualTime = calculateActualTime(flight.departure_scheduled, flight.delay_minutes);

                        return (
                            <tr key={flight.id || index} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                <td className="px-5 py-4 text-sm font-bold text-primary dark:text-primary-400">{flight.flight_num}</td>
                                <td className="px-5 py-4 text-sm font-medium text-slate-900 dark:text-slate-100">{flight.airline}</td>
                                <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">{flight.origin}</td>
                                <td className="px-5 py-4">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${statusConfig.color}`}>
                                        <span className={`size-1.5 rounded-full ${statusConfig.dot}`}></span> {statusConfig.text}
                                    </span>
                                </td>
                                <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">{scheduledTime} / {String(flight.status).toLowerCase() === 'cancelled' ? '--:--' : actualTime}</td>
                            </tr>
                        );
                    })}
                     {filteredFlights.length === 0 && (
                        <tr>
                            <td colSpan={5} className="px-5 py-8 text-center text-slate-500">{t("noFlights")}</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
             <span className="text-xs text-slate-500">{t("showing", { count: filteredFlights.length })}</span>
             <div className="flex gap-2">
                <button className="size-8 rounded border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-white dark:hover:bg-slate-800 disabled:opacity-50">
                    <span className="material-symbols-outlined text-sm">chevron_left</span>
                </button>
                <button className="size-8 rounded border border-slate-200 dark:border-slate-700 flex items-center justify-center bg-white dark:bg-slate-700 font-bold text-xs">1</button>
                 <button className="size-8 rounded border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-white dark:hover:bg-slate-800">
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
             </div>
        </div>
    </div>
  );
}
