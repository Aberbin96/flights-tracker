"use client";

import { useTranslations } from "next-intl";

interface KPISectionProps {
  totalFlights: number;
  punctuality: number; // percentage 0-100
  delays: number;
  cancellations: number;
}

export function KPISection({ totalFlights, punctuality, delays, cancellations }: KPISectionProps) {
  const t = useTranslations("Dashboard");

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
       {/* Card 1: Total Flights */}
       <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start mb-2">
             <span className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase">{t("totalFlights")}</span>
             <span className="material-symbols-outlined text-primary bg-primary/10 p-1.5 rounded-lg">flight</span>
          </div>
          <div className="flex items-baseline gap-2">
             <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{totalFlights}</span>
          </div>
       </div>

       {/* Card 2: Punctuality */}
       <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start mb-2">
             <span className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase">{t("punctuality")}</span>
             <span className="material-symbols-outlined text-emerald-500 bg-emerald-500/10 p-1.5 rounded-lg">timer</span>
          </div>
          <div className="flex items-baseline gap-2">
             <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{punctuality.toFixed(0)}%</span>
          </div>
       </div>

       {/* Card 3: Delays */}
       <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start mb-2">
             <span className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase">{t("delays")}</span>
             <span className="material-symbols-outlined text-amber-500 bg-amber-500/10 p-1.5 rounded-lg">schedule</span>
          </div>
          <div className="flex items-baseline gap-2">
             <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{delays}</span>
          </div>
       </div>

       {/* Card 4: Cancellations */}
       <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start mb-2">
             <span className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase">{t("cancellations")}</span>
             <span className="material-symbols-outlined text-rose-500 bg-rose-500/10 p-1.5 rounded-lg">cancel</span>
          </div>
          <div className="flex items-baseline gap-2">
             <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{cancellations}</span>
          </div>
       </div>
    </div>
  );
}
