"use client";

import React from "react";
import { FlightRecord, FlightStatus } from "@/types/flight";
import { useTranslations } from "next-intl";
import { Icon } from "./atoms/Icon";
import { Tooltip } from "./atoms/Tooltip";
import { AirlineStats } from "@/app/[locale]/page";

interface ConsolidatedFleetStatusProps {
  flights: FlightRecord[];
  previousPerformance?: AirlineStats[];
}

export function ConsolidatedFleetStatus({
  flights,
  previousPerformance = [],
}: ConsolidatedFleetStatusProps) {
  const t = useTranslations("Dashboard");

  // Group by airline and calculate stats
  const airlineGroups = flights.reduce(
    (acc, flight) => {
      if (!acc[flight.airline]) {
        acc[flight.airline] = {
          name: flight.airline,
          flights: [],
          total: 0,
          delayed: 0,
          cancelled: 0,
        };
      }

      const group = acc[flight.airline];
      group.flights.push(flight);
      group.total++;

      if (flight.status === FlightStatus.CANCELLED) {
        group.cancelled++;
      } else if (flight.delay_minutes > 15) {
        group.delayed++;
      }

      return acc;
    },
    {} as Record<
      string,
      {
        name: string;
        flights: FlightRecord[];
        total: number;
        delayed: number;
        cancelled: number;
      }
    >,
  );

  const sortedAirlines = Object.values(airlineGroups).sort(
    (a, b) => b.total - a.total,
  );

  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const getStatusColor = (status: string | FlightStatus) => {
    switch (status) {
      case FlightStatus.ACTIVE:
      case FlightStatus.LANDED:
        return "text-emerald-500 dark:text-emerald-400";
      case FlightStatus.SCHEDULED:
        return "text-violet-500 dark:text-amber-400";
      case FlightStatus.CANCELLED:
        return "text-rose-500 dark:text-rose-400";
      case FlightStatus.DIVERTED:
        return "text-amber-500 dark:text-violet-400";
      default:
        return "text-slate-400 dark:text-slate-500";
    }
  };

  const getStatusLabel = (status: string | FlightStatus) => {
    switch (status) {
      case FlightStatus.ACTIVE:
        return t("statusActive");
      case FlightStatus.SCHEDULED:
        return t("statusScheduled");
      case FlightStatus.LANDED:
        return t("statusLanded");
      case FlightStatus.CANCELLED:
        return t("statusCancelled");
      case FlightStatus.DIVERTED:
        return t("statusDiverted");
      default:
        return t("statusUnknown");
    }
  };

  return (
    <div className="xl:col-span-3 bg-white/80 dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/10">
        <h3 className="font-bold text-slate-800 dark:text-white text-lg">
          {t("airlinePerformance")} & {t("fleetActivity")}
        </h3>
        <p className="text-xs text-slate-500 mt-1">{t("legend")}</p>
      </div>

      <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800/60">
        {sortedAirlines.map((group) => {
          const delayPct = Math.round((group.delayed / group.total) * 100);
          const cancelPct = Math.round((group.cancelled / group.total) * 100);

          // Find previous performance for this airline
          const prev = previousPerformance.find(
            (p) => p.airline === group.name,
          );
          const flightsTrend = prev
            ? calculateTrend(group.total, prev.today_flights)
            : 0;

          return (
            <div
              key={group.name}
              className="p-4 flex flex-col sm:flex-row gap-4 hover:bg-slate-50/30 dark:hover:bg-slate-800/10 transition-colors"
            >
              {/* Info Column */}
              <div className="flex flex-col min-w-[140px] sm:w-48 shrink-0">
                <div className="mb-2">
                  <h4 className="font-bold text-slate-800 dark:text-white text-sm sm:text-base">
                    {group.name}
                  </h4>
                  <div className="flex items-center gap-1.5">
                    <div className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tighter">
                      {group.total} {t("totalFlights")}
                    </div>
                    {flightsTrend !== 0 && (
                      <span
                        className={`text-[8px] font-bold ${flightsTrend > 0 ? "text-emerald-500" : "text-rose-500"} flex items-center`}
                      >
                        <Icon
                          name={
                            flightsTrend > 0 ? "trending_up" : "trending_down"
                          }
                          className="text-[8px] mr-1"
                        />
                        {Math.abs(flightsTrend).toFixed(0)}%
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">
                      {t("delays")}
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span
                        className={`text-xs font-black ${delayPct > 20 ? "text-rose-500" : delayPct > 10 ? "text-amber-500" : "text-emerald-500"}`}
                      >
                        {delayPct}%
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">
                      {t("cancellations")}
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span
                        className={`text-xs font-black ${cancelPct > 10 ? "text-rose-500" : cancelPct > 5 ? "text-amber-500" : "text-emerald-500"}`}
                      >
                        {cancelPct}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Icons Area */}
              <div className="flex-1 flex items-center pt-2 sm:pt-0 sm:pl-4 border-t sm:border-t-0 sm:border-l border-slate-100 dark:border-slate-800">
                <div className="flex flex-wrap gap-2">
                  {group.flights.map((flight) => (
                    <Tooltip
                      key={
                        flight.id ||
                        `${flight.flight_num}-${flight.departure_scheduled}`
                      }
                      content={`${flight.flight_num}: ${getStatusLabel(flight.status)}`}
                    >
                      <div className="transition-transform hover:scale-125">
                        <Icon
                          name="flight"
                          className={`${getStatusColor(flight.status)} text-2xl cursor-help`}
                        />
                      </div>
                    </Tooltip>
                  ))}
                </div>
              </div>
            </div>
          );
        })}

        {sortedAirlines.length === 0 && (
          <div className="p-12 text-center text-sm text-slate-400">
            {t("noData")}
          </div>
        )}
      </div>
    </div>
  );
}
