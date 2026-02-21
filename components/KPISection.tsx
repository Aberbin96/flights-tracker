"use client";

import { useTranslations } from "next-intl";
import { Icon } from "./atoms/Icon";

interface KPISectionProps {
  totalFlights: number;
  punctuality: number; // percentage 0-100
  delays: number;
  cancellations: number;
}

export function KPISection({
  totalFlights,
  punctuality,
  delays,
  cancellations,
}: KPISectionProps) {
  const t = useTranslations("Dashboard");

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 mb-8">
      {/* Card 1: Total Flights */}
      <div className="bg-white/70 dark:bg-slate-900 p-3 sm:p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm backdrop-blur-sm transition-all hover:shadow-md hover:border-primary/20">
        <div className="flex justify-between items-start mb-1 sm:mb-2">
          <span className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
            {t("totalFlights")}
          </span>
          <Icon
            name="flight"
            className="text-primary bg-primary/10 p-1.5 sm:p-2 rounded-xl text-sm sm:text-base"
          />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-800 dark:text-white">
            {totalFlights}
          </span>
        </div>
      </div>

      {/* Card 2: Punctuality */}
      <div className="bg-white/70 dark:bg-slate-900 p-3 sm:p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm backdrop-blur-sm transition-all hover:shadow-md hover:border-emerald-500/20">
        <div className="flex justify-between items-start mb-1 sm:mb-2">
          <span className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
            {t("punctuality")}
          </span>
          <Icon
            name="timer"
            className="text-emerald-600 dark:text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 p-1.5 sm:p-2 rounded-xl text-sm sm:text-base"
          />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-800 dark:text-white">
            {punctuality.toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Card 3: Delays */}
      <div className="bg-white/70 dark:bg-slate-900 p-3 sm:p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm backdrop-blur-sm transition-all hover:shadow-md hover:border-amber-500/20">
        <div className="flex justify-between items-start mb-1 sm:mb-2">
          <span className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
            {t("delays")}
          </span>
          <Icon
            name="schedule"
            className="text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-500/10 p-1.5 sm:p-2 rounded-xl text-sm sm:text-base"
          />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-800 dark:text-white">
            {delays}
          </span>
        </div>
      </div>

      {/* Card 4: Cancellations */}
      <div className="bg-white/70 dark:bg-slate-900 p-3 sm:p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm backdrop-blur-sm transition-all hover:shadow-md hover:border-rose-500/20">
        <div className="flex justify-between items-start mb-1 sm:mb-2">
          <span className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
            {t("cancellations")}
          </span>
          <Icon
            name="cancel"
            className="text-rose-600 dark:text-rose-500 bg-rose-50 dark:bg-rose-500/10 p-1.5 sm:p-2 rounded-xl text-sm sm:text-base"
          />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-800 dark:text-white">
            {cancellations}
          </span>
        </div>
      </div>
    </div>
  );
}
