"use client";

import { FlightRecord } from "@/types/flight";
import { useTranslations } from "next-intl";

interface FleetActivityProps {
  flights: FlightRecord[];
}

export function FleetActivity({ flights }: FleetActivityProps) {
  const t = useTranslations("Dashboard");

  // Group by airline
  const grouped = flights.reduce((acc, flight) => {
    if (!acc[flight.airline]) acc[flight.airline] = [];
    acc[flight.airline].push(flight);
    return acc;
  }, {} as Record<string, FlightRecord[]>);

  const airlines = Object.keys(grouped).sort();

  return (
    <div className="xl:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm h-fit">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white">{t("fleetActivity")}</h3>
            <p className="text-xs text-slate-500 mt-1">{t("legend")}</p>
        </div>
        <div className="p-6 flex flex-col gap-6">
            {airlines.map(airline => (
                <div key={airline} className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="w-32 flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{airline}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {grouped[airline].map(flight => {
                            let colorClass = "text-emerald-500";
                            let statusText = t("onTime");

                            if (flight.status === 'cancelled') {
                                colorClass = "text-rose-500";
                                statusText = t("cancelled");
                            } else if (flight.delay_minutes > 15) {
                                colorClass = "text-amber-500";
                                statusText = t("delayed");
                            }

                            const title = `${flight.flight_num}: ${statusText}`;

                            return (
                                <span key={flight.id || flight.flight_num} className={`material-symbols-outlined ${colorClass} text-lg cursor-help`} title={title}>
                                    flight
                                </span>
                            );
                        })}
                    </div>
                </div>
            ))}
            {airlines.length === 0 && <p className="text-sm text-slate-500">{t("noActivity")}</p>}
        </div>
    </div>
  );
}
