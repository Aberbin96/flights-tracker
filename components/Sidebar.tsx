"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";

interface SidebarProps {
  airports: string[];
  minDate: string;
}

const AIRPORT_NAMES: Record<string, string> = {
  CCS: "Maiquetía",
  VLN: "Valencia",
  MAR: "Maracaibo",
  BLA: "Barcelona",
  PMV: "Porlamar",
  PZO: "Puerto Ordaz",
  STD: "Santo Domingo",
  VIG: "El Vigía",
  BRM: "Barquisimeto",
  LSP: "Las Piedras",
};

export function Sidebar({ airports, minDate }: SidebarProps) {
  const t = useTranslations("Dashboard");
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialAirport = searchParams.get("origin") || "";
  const initialDate = searchParams.get("date") || "";

  const [selectedAirport, setSelectedAirport] = useState(initialAirport);
  const [selectedDate, setSelectedDate] = useState(initialDate);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedAirport(searchParams.get("origin") || "");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedDate(searchParams.get("date") || "");
  }, [searchParams]);

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (selectedAirport) params.set("origin", selectedAirport);
    else params.delete("origin");
    if (selectedDate) params.set("date", selectedDate);
    else params.delete("date");
    router.push(`?${params.toString()}`);
  };

  const handleAirportClick = (code: string) => {
    if (selectedAirport === code) {
      setSelectedAirport("");
    } else {
      setSelectedAirport(code);
    }
  };

  return (
    <aside className="w-72 border-r border-slate-200/60 dark:border-slate-800 bg-white/50 dark:bg-slate-900 flex-col hidden lg:flex sticky h-[calc(100vh-73px)] overflow-y-auto">
      <div className="p-6 flex flex-col gap-6">
        <div>
          <h3 className="text-slate-800 dark:text-white text-sm font-bold uppercase tracking-wider mb-4">
            {t("airports")}
          </h3>
          <div className="flex flex-col gap-1">
            {airports.map((code) => (
              <div
                key={code}
                onClick={() => handleAirportClick(code)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${selectedAirport === code ? "bg-primary/10 text-primary font-semibold" : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800"}`}
              >
                <span className="material-symbols-outlined text-lg">
                  location_on
                </span>
                <span className="text-sm font-medium">
                  {AIRPORT_NAMES[code] || code} ({code})
                </span>
                {selectedAirport === code && (
                  <span className="ml-auto material-symbols-outlined text-sm">
                    check_circle
                  </span>
                )}
              </div>
            ))}
            {airports.length === 0 && (
              <p className="text-sm text-slate-400 px-3">{t("noAirports")}</p>
            )}
          </div>
        </div>
        <div className="border-t border-slate-200/60 dark:border-slate-800 pt-6">
          <h3 className="text-slate-800 dark:text-white text-sm font-bold uppercase tracking-wider mb-4">
            {t("dateRange")}
          </h3>
          <div className="flex flex-col gap-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-lg">
                calendar_today
              </span>
              <input
                type="date"
                min={minDate}
                max={new Date().toISOString().split("T")[0]}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-none shadow-sm rounded-lg text-sm focus:ring-2 focus:ring-primary/20 text-slate-700 dark:text-slate-100 transition-all"
              />
            </div>
          </div>
          <button
            onClick={applyFilters}
            className="mt-4 w-full bg-primary text-white rounded-lg py-2.5 text-sm font-bold shadow-md shadow-primary/30 hover:bg-primary-dark transition-all cursor-pointer"
          >
            {t("applyFilters")}
          </button>
        </div>
      </div>
    </aside>
  );
}
