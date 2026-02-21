"use client";

import { FlightRecord } from "@/types/flight";
import { useTranslations } from "next-intl";
import { Icon } from "./atoms/Icon";
import { Tooltip } from "./atoms/Tooltip";

interface FleetActivityProps {
  flights: FlightRecord[];
}

export function FleetActivity({ flights }: FleetActivityProps) {
  const t = useTranslations("Dashboard");

  // Group by airline
  const grouped = flights.reduce(
    (acc, flight) => {
      if (!acc[flight.airline]) acc[flight.airline] = [];
      acc[flight.airline].push(flight);
      return acc;
    },
    {} as Record<string, FlightRecord[]>,
  );

  const airlines = Object.keys(grouped).sort();

  return (
    <div className="xl:col-span-2 bg-white/80 dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 overflow-hidden shadow-sm h-fit">
      <div className="p-5 border-b border-slate-100 dark:border-slate-800">
        <h3 className="font-bold text-slate-800 dark:text-white">
          {t("fleetActivity")}
        </h3>
        <p className="text-xs text-slate-500 mt-1">{t("legend")}</p>
      </div>
      <div className="p-6 flex flex-col gap-6">
        {airlines.map((airline) => (
          <div
            key={airline}
            className="flex flex-col sm:flex-row sm:items-center gap-4"
          >
            <div className="w-32 flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {airline}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {grouped[airline].map((flight) => {
                let colorClass = "text-emerald-500 dark:text-emerald-400";
                let statusText = t("onTime");

                if (flight.status === "cancelled") {
                  colorClass = "text-rose-500 dark:text-rose-400";
                  statusText = t("cancelled");
                } else if (flight.delay_minutes > 15) {
                  colorClass = "text-amber-500 dark:text-amber-400";
                  statusText = t("delayed");
                }

                const tooltipContent = `${flight.flight_num}: ${statusText}`;

                return (
                  <Tooltip
                    key={flight.id || flight.flight_num}
                    content={tooltipContent}
                  >
                    <Icon
                      name="flight"
                      className={`${colorClass} text-lg cursor-help hover:scale-110 transition-transform`}
                    />
                  </Tooltip>
                );
              })}
            </div>
          </div>
        ))}
        {airlines.length === 0 && (
          <p className="text-sm text-slate-400">{t("noActivity")}</p>
        )}
      </div>
    </div>
  );
}
