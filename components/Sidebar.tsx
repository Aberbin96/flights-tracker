"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import { Button } from "./atoms/Button";
import { Icon } from "./atoms/Icon";
import { AIRPORT_NAMES } from "@/constants/flights";

interface SidebarProps {
  airports: string[];
  airlines: string[];
  minDate: string;
}

export function Sidebar({ airports, airlines, minDate }: SidebarProps) {
  const t = useTranslations("Dashboard");
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleToggle = () => setIsOpen((prev) => !prev);
    document.addEventListener("toggleSidebar", handleToggle);
    return () => document.removeEventListener("toggleSidebar", handleToggle);
  }, []);

  const currentCaracasDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Caracas",
  }).format(new Date());

  // Let's use searchParams as the source of truth for the values we display.
  const currentAirport = searchParams.get("origin") || "CCS";
  const currentDate = searchParams.get("date") || currentCaracasDate;
  const currentAirline = searchParams.get("airline") || "";
  const currentCompanyType = searchParams.get("companyType") || "public";
  const currentNational = searchParams.has("national")
    ? searchParams.get("national") === "true"
    : true;
  const currentInternational = searchParams.has("international")
    ? searchParams.get("international") === "true"
    : true;

  const updateFilters = (updates: Record<string, string | boolean>) => {
    const params = new URLSearchParams(searchParams.toString());

    // Merge new updates with current source of truth
    const currentParams = {
      origin: currentAirport,
      date: currentDate,
      airline: currentAirline,
      companyType: currentCompanyType,
      national: currentNational,
      international: currentInternational,
      ...updates,
    };

    if (currentParams.origin)
      params.set("origin", currentParams.origin as string);
    else params.delete("origin");
    if (currentParams.date) params.set("date", currentParams.date as string);
    else params.delete("date");
    if (currentParams.airline)
      params.set("airline", currentParams.airline as string);
    else params.delete("airline");
    if (currentParams.companyType !== "public")
      params.set("companyType", currentParams.companyType as string);
    else params.delete("companyType");

    // Only pass bools if they are flipped to false to save URL space (both are true by default)
    if (!currentNational && !updates.national && updates.national !== undefined)
      params.delete("national");
    if (currentParams.national === false) params.set("national", "false");
    else params.delete("national");

    if (currentParams.international === false)
      params.set("international", "false");
    else params.delete("international");

    router.push(`?${params.toString()}`);
  };

  const handleAirportClick = (code: string) => {
    const newAirport = currentAirport === code ? "" : code;
    updateFilters({ origin: newAirport });
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Content */}
      <aside
        className={`
        fixed inset-y-0 left-0 z-50 w-72 h-[100dvh] 
        border-r border-slate-200/60 dark:border-slate-800 
        bg-white dark:bg-slate-900 shadow-2xl lg:shadow-none
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 lg:static lg:block lg:sticky lg:h-[calc(100vh-73px)]
        overflow-y-auto flex-col
      `}
      >
        <div className="p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between lg:hidden mb-2">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">
              {t("filters")}
            </h2>
            <Button onClick={() => setIsOpen(false)} variant="icon">
              <Icon name="close" className="text-xl" />
            </Button>
          </div>

          <div className="border-b border-slate-200/60 dark:border-slate-800 pb-6">
            <h3 className="text-slate-800 dark:text-white text-sm font-bold uppercase tracking-wider mb-4">
              {t("date")}
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
                  value={currentDate}
                  onChange={(e) => {
                    updateFilters({ date: e.target.value });
                  }}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm text-slate-700 dark:text-slate-100"
                />
              </div>
            </div>
          </div>

          <div className="border-b border-slate-200/60 dark:border-slate-800 pb-6">
            <h3 className="text-slate-800 dark:text-white text-sm font-bold uppercase tracking-wider mb-4">
              {t("airline")}
            </h3>
            <select
              value={currentAirline}
              onChange={(e) => {
                updateFilters({ airline: e.target.value });
              }}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm text-slate-700 dark:text-slate-100 appearance-none"
            >
              <option value="">{t("allAirlines")}</option>
              {airlines.map((airline) => (
                <option key={airline} value={airline}>
                  {airline}
                </option>
              ))}
            </select>
          </div>

          <div className="border-b border-slate-200/60 dark:border-slate-800 pb-6">
            <h3 className="text-slate-800 dark:text-white text-sm font-bold uppercase tracking-wider mb-4">
              {t("flightType")}
            </h3>
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={currentNational}
                  onChange={(e) => {
                    updateFilters({ national: e.target.checked });
                  }}
                  className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary/20"
                />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white">
                  {t("domestic")}
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={currentInternational}
                  onChange={(e) => {
                    updateFilters({ international: e.target.checked });
                  }}
                  className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary/20"
                />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white">
                  {t("international")}
                </span>
              </label>
            </div>
          </div>

          <div className="border-b border-slate-200/60 dark:border-slate-800 pb-6">
            <h3 className="text-slate-800 dark:text-white text-sm font-bold uppercase tracking-wider mb-4">
              {t("companyType")}
            </h3>
            <select
              value={currentCompanyType}
              onChange={(e) => {
                updateFilters({ companyType: e.target.value });
              }}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm text-slate-700 dark:text-slate-100 appearance-none"
            >
              <option value="all">{t("allCompanyTypes")}</option>
              <option value="commercial">{t("commercial")}</option>
              <option value="cargo">{t("cargo")}</option>
              <option value="public">{t("public")}</option>
              <option value="private">{t("private")}</option>
            </select>
          </div>

          <div>
            <h3 className="text-slate-800 dark:text-white text-sm font-bold uppercase tracking-wider mb-4">
              {t("originAirport")}
            </h3>
            <div className="flex flex-col gap-1">
              {airports.map((code) => (
                <div
                  key={code}
                  onClick={() => handleAirportClick(code)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${currentAirport === code ? "bg-primary/10 text-primary font-semibold" : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-200"}`}
                >
                  <Icon name="location_on" className="text-lg" />
                  <span className="text-sm font-medium">
                    {AIRPORT_NAMES[code] || code} ({code})
                  </span>
                  {currentAirport === code && (
                    <Icon name="check_circle" className="ml-auto text-sm" />
                  )}
                </div>
              ))}
              {airports.length === 0 && (
                <p className="text-sm text-slate-400 px-3">{t("noAirports")}</p>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
