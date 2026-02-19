"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Calendar, Filter, X } from "lucide-react";
import { useState, useEffect } from "react";

interface FilterBarProps {
  airlines: string[];
  minDate: string;
}

export function FilterBar({ airlines, minDate }: FilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("Filter");

  const [selectedAirline, setSelectedAirline] = useState(
    searchParams.get("airline") || "",
  );
  const [selectedDate, setSelectedDate] = useState(
    searchParams.get("date") || "",
  );

  // Update URL function
  const applyFilters = (airline: string, date: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (airline) params.set("airline", airline);
    else params.delete("airline");

    if (date) params.set("date", date);
    else params.delete("date");

    router.push(`?${params.toString()}`);
  };

  const handleAirlineChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedAirline(value);
    applyFilters(value, selectedDate);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSelectedDate(value);
    applyFilters(selectedAirline, value);
  };

  const clearFilters = () => {
    setSelectedAirline("");
    setSelectedDate("");
    router.push("?");
  };

  const hasFilters = selectedAirline || selectedDate;

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6 bg-white dark:bg-zinc-900 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm">
      <div className="flex-1 flex flex-col md:flex-row gap-4 items-center">
        {/* Airline Selector */}
        <div className="relative w-full md:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Filter className="h-4 w-4 text-zinc-500" />
          </div>
          <select
            value={selectedAirline}
            onChange={handleAirlineChange}
            className="block w-full pl-10 pr-4 py-2 text-base border-zinc-300 dark:border-zinc-700 focus:outline-none focus:ring-zinc-900 focus:border-zinc-900 sm:text-sm rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 appearance-none cursor-pointer"
          >
            <option value="">{t("allAirlines")}</option>
            {airlines.map((airline) => (
              <option key={airline} value={airline}>
                {airline}
              </option>
            ))}
          </select>
        </div>

        {/* Date Picker */}
        <div className="relative w-full md:w-auto">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Calendar className="h-4 w-4 text-zinc-500" />
          </div>
          <input
            type="date"
            min={minDate}
            max={new Date().toISOString().split("T")[0]} // Limit to today
            value={selectedDate}
            onChange={handleDateChange}
            className="block w-full pl-10 pr-4 py-2 text-base border-zinc-300 dark:border-zinc-700 focus:outline-none focus:ring-zinc-900 focus:border-zinc-900 sm:text-sm rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
          />
        </div>
      </div>

      {hasFilters && (
        <button
          onClick={clearFilters}
          className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 dark:text-red-400 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded-md transition-colors w-full md:w-auto"
        >
          <X className="w-4 h-4" />
          {t("reset")}
        </button>
      )}
    </div>
  );
}
