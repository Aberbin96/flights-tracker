"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import { Button } from "./atoms/Button";
import { Icon } from "./atoms/Icon";

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

  const currentCaracasDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Caracas",
  }).format(new Date());

  const initialAirport = searchParams.has("origin")
    ? searchParams.get("origin") || ""
    : "CCS";
  const initialDate = searchParams.has("date")
    ? searchParams.get("date") || ""
    : currentCaracasDate;

  const [selectedAirport, setSelectedAirport] = useState(initialAirport);
  const [selectedDate, setSelectedDate] = useState(initialDate);

  useEffect(() => {
    setSelectedAirport(
      searchParams.has("origin") ? searchParams.get("origin") || "" : "CCS",
    );
    setSelectedDate(
      searchParams.has("date")
        ? searchParams.get("date") || ""
        : currentCaracasDate,
    );
  }, [searchParams]);

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("origin", selectedAirport);
    params.set("date", selectedDate);
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
                <Icon name="location_on" className="text-lg" />
                <span className="text-sm font-medium">
                  {AIRPORT_NAMES[code] || code} ({code})
                </span>
                {selectedAirport === code && (
                  <Icon name="check_circle" className="ml-auto text-sm" />
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
              <Icon
                name="calendar_today"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg"
              />
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
          <div className="flex flex-col gap-2 mt-4">
            <Button onClick={applyFilters} variant="primary" fullWidth>
              {t("applyFilters")}
            </Button>
            {(selectedAirport || selectedDate) && (
              <Button
                onClick={() => {
                  setSelectedAirport("");
                  setSelectedDate("");
                  router.push("/?origin=&date=");
                }}
                variant="secondary"
                fullWidth
              >
                {t("clearFilters")}
              </Button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
