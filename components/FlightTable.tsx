"use client";

import { FlightRecord } from "@/types/flight";
import { useTranslations } from "next-intl";
import { useState, useMemo } from "react";
import { Icon } from "./atoms/Icon";
import { Badge, BadgeVariant } from "./atoms/Badge";
import { Button } from "./atoms/Button";

interface FlightTableProps {
  flights: FlightRecord[];
}

export function FlightTable({ flights }: FlightTableProps) {
  const t = useTranslations("Dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Helper to format time
  const formatTime = (dateStr?: string | null) => {
    if (!dateStr) return "--:--";
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
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
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } catch {
      return "--:--";
    }
  };

  const filteredFlights = useMemo(() => {
    return flights.filter(
      (flight) =>
        searchTerm === "" ||
        flight.flight_num.toLowerCase().includes(searchTerm.toLowerCase()) ||
        flight.airline.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [flights, searchTerm]);

  const totalPages = Math.ceil(filteredFlights.length / itemsPerPage) || 1;

  // Handle case where filtering reduces pages below current page
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(1);
  }

  const paginatedFlights = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredFlights.slice(start, start + itemsPerPage);
  }, [filteredFlights, currentPage]);

  return (
    <div className="mt-8 bg-white/80 dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 overflow-hidden shadow-sm">
      <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
        <h3 className="font-bold text-slate-800 dark:text-white w-full sm:w-auto">
          {t("detailedList")}
        </h3>
        <div className="relative w-full sm:w-64 flex-shrink-0">
          <Icon
            name="search"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg"
          />
          <input
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-none shadow-sm rounded-lg text-sm focus:ring-2 focus:ring-primary/20 text-slate-700 dark:text-slate-100 transition-all outline-none"
            placeholder={t("searchPlaceholder")}
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50/50 dark:bg-slate-800/50 backdrop-blur-sm border-b border-slate-100 dark:border-slate-800">
            <tr>
              <th className="px-5 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider">
                {t("flight")}
              </th>
              <th className="px-5 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider">
                {t("airline")}
              </th>
              <th className="px-5 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider">
                {t("route")}
              </th>
              <th className="px-5 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider">
                {t("status")}
              </th>
              <th className="px-5 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider">
                {t("progReal")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {paginatedFlights.map((flight, index) => {
              let badgeVariant: BadgeVariant = "success";
              let statusText = t("onTime");

              if (String(flight.status).toLowerCase() === "cancelled") {
                badgeVariant = "error";
                statusText = t("cancelled");
              } else if (flight.delay_minutes > 15) {
                badgeVariant = "warning";
                statusText = t("delayed");
              }

              const scheduledTime = formatTime(flight.departure_scheduled);
              const actualTime = calculateActualTime(
                flight.departure_scheduled,
                flight.delay_minutes,
              );

              return (
                <tr
                  key={flight.id || index}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/80 transition-colors group"
                >
                  <td className="px-5 py-4 text-sm font-bold text-primary dark:text-primary-400 group-hover:text-primary-dark transition-colors">
                    {flight.flight_num}
                  </td>
                  <td className="px-5 py-4 text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {flight.airline}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400">
                    {flight.origin}
                  </td>
                  <td className="px-5 py-4 flex items-center gap-1.5">
                    {flight.is_system_closed && (
                      <span
                        title={
                          t("systemClosedToolTip") || "Auto-closed by system"
                        }
                        className="text-slate-400 bg-slate-100 dark:bg-slate-800 rounded px-1 flex items-center cursor-help"
                      >
                        <Icon name="smart_toy" className="text-[14px]" />
                      </span>
                    )}
                    <Badge variant={badgeVariant} text={statusText} />
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400 font-mono">
                    {scheduledTime}{" "}
                    <span className="text-slate-300 dark:text-slate-600">
                      /
                    </span>{" "}
                    <span
                      className={
                        String(flight.status).toLowerCase() === "cancelled"
                          ? "text-slate-400"
                          : flight.delay_minutes > 15
                            ? "text-amber-600 dark:text-amber-400 font-bold"
                            : "text-emerald-600 dark:text-emerald-400 font-bold"
                      }
                    >
                      {String(flight.status).toLowerCase() === "cancelled"
                        ? "--:--"
                        : actualTime}
                    </span>
                  </td>
                </tr>
              );
            })}
            {paginatedFlights.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-5 py-12 text-center text-slate-400 text-sm"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Icon name="search_off" className="text-4xl opacity-50" />
                    {t("noFlights")}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="p-4 bg-white dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
        <span className="text-xs font-semibold text-slate-500">
          {t("showing", { count: filteredFlights.length })}
        </span>
        <div className="flex gap-2">
          <Button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            variant="secondary"
            className="size-8 p-0" // Override padding for exact square if needed since it has generic padding
          >
            <Icon name="chevron_left" className="text-sm" />
          </Button>
          <div className="px-3 min-w-[32px] rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center bg-slate-50 dark:bg-slate-700 font-bold text-xs text-slate-700 dark:text-white shadow-sm">
            {currentPage} <span className="text-slate-400 mx-1">/</span>{" "}
            {totalPages}
          </div>
          <Button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            variant="secondary"
            className="size-8 p-0"
          >
            <Icon name="chevron_right" className="text-sm" />
          </Button>
        </div>
      </div>
    </div>
  );
}
