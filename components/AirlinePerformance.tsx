"use client";

import { useTranslations } from "next-intl";

export interface AirlineStats {
  airline: string;
  on_time_percentage: number;
}

interface AirlinePerformanceProps {
  data: AirlineStats[];
}

export function AirlinePerformance({ data }: AirlinePerformanceProps) {
  const t = useTranslations("Dashboard");

  return (
    <div className="xl:col-span-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm h-fit">
      <div className="p-5 border-b border-slate-100 dark:border-slate-800">
         <h3 className="font-bold text-slate-900 dark:text-white">{t("airlinePerformance")}</h3>
      </div>
      <div className="p-5 flex flex-col gap-5">
         {data.map((airline) => {
             const percentage = Math.round(airline.on_time_percentage);
             let colorClass = "bg-emerald-500";
             if (percentage < 60) colorClass = "bg-rose-400";
             else if (percentage < 80) colorClass = "bg-amber-400";

             return (
               <div key={airline.airline} className="flex items-center gap-4">
                  <div className="flex-1">
                     <div className="flex justify-between mb-1">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{airline.airline}</span>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{percentage}%</span>
                     </div>
                     <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className={`${colorClass} h-full`} style={{ width: `${percentage}%` }}></div>
                     </div>
                  </div>
               </div>
             );
         })}
         {data.length === 0 && <p className="text-sm text-slate-500">{t("noData")}</p>}
      </div>
    </div>
  );
}
