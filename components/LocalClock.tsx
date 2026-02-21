"use client";

import { useTranslations, useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

export function LocalClock() {
  const t = useTranslations("Index");
  const locale = useLocale();
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        timeZone: "America/Caracas",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      };
      setTime(
        now.toLocaleTimeString(locale === "en" ? "en-US" : "es-VE", options),
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  // Avoid hydration mismatch by not rendering until client-side
  if (!time) return null;

  return (
    <div className="flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-900/50 px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800">
      <Clock className="w-4 h-4" />
      <span>
        {t("localTime")}: {time}
      </span>
    </div>
  );
}
