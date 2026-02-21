"use client";

import { useTranslations } from "next-intl";

export interface AirlineStats {
  airline: string;
  total_percentage: number;
  today_percentage: number;
  today_flights: number;
}

interface AirlinePerformanceProps {
  data: AirlineStats[];
}

export function AirlinePerformance({ data }: AirlinePerformanceProps) {
  const t = useTranslations("Dashboard");

  return (
    <div className="xl:col-span-1 bg-white/80 dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800 overflow-hidden shadow-sm h-fit">
      <div className="flex justify-between items-center px-4 py-3 bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800/60">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          {t("airlinePerformance")}
        </h3>
        <div className="flex gap-4 text-[9px] font-bold uppercase tracking-wider text-slate-400">
          <span>{t("today")}</span>
          <span>{t("total")}</span>
        </div>
      </div>

      <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800/60">
        {data.map((airline) => {
          const todayPercentage = Math.round(airline.today_percentage);
          const totalPercentage = Math.round(airline.total_percentage);

          let todayColorClass =
            "text-slate-400 dark:text-slate-500 font-medium";

          if (airline.today_flights > 0) {
            todayColorClass =
              "text-emerald-600 dark:text-emerald-400 font-bold";
            if (todayPercentage < 60)
              todayColorClass = "text-rose-600 dark:text-rose-400 font-bold";
            else if (todayPercentage < 80)
              todayColorClass = "text-amber-600 dark:text-amber-400 font-bold";
          }

          let totalColorClass =
            "text-emerald-600/70 dark:text-emerald-400/70 font-semibold";
          if (totalPercentage < 60)
            totalColorClass =
              "text-rose-600/70 dark:text-rose-400/70 font-semibold";
          else if (totalPercentage < 80)
            totalColorClass =
              "text-amber-600/70 dark:text-amber-400/70 font-semibold";

          return (
            <div
              key={airline.airline}
              className="flex justify-between items-center px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
            >
              <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100 truncate pr-2">
                {airline.airline}
              </span>
              <div className="flex gap-4 text-[11px] tabular-nums shrink-0 text-right">
                <span className={`w-10 ${todayColorClass}`}>
                  {todayPercentage}%
                </span>
                <span className={`w-10 ${totalColorClass}`}>
                  {totalPercentage}%
                </span>
              </div>
            </div>
          );
        })}
        {data.length === 0 && (
          <div className="px-4 py-3 text-[10px] text-slate-400 text-center">
            {t("noData")}
          </div>
        )}
      </div>
    </div>
  );
}
