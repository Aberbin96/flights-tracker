"use client";

import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition, useState, useEffect } from "react";

export function Header() {
  const t = useTranslations("Dashboard");
  const locale = useLocale();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check initial theme preference
    if (typeof window !== "undefined") {
        const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const isClassDark = document.documentElement.classList.contains('dark');
        // eslint-disable-next-line
        setIsDark(isClassDark || isSystemDark);
    }
  }, []);

  const toggleTheme = () => {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
        html.classList.remove('dark');
        setIsDark(false);
    } else {
        html.classList.add('dark');
        setIsDark(true);
    }
  };

  const toggleLanguage = () => {
    const nextLocale = locale === "en" ? "es" : "en";
    startTransition(() => {
      const currentPath = window.location.pathname;
      const segments = currentPath.split("/");
      segments[1] = nextLocale;
      const newPath = segments.join("/");
      router.replace(newPath);
    });
  };

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const handleShare = () => {
     if (navigator.share) {
        navigator.share({
            title: "Radar de Vuelos Venezuela",
            url: shareUrl
        }).catch(console.error);
     } else {
        // Fallback or just alert/copy
        navigator.clipboard.writeText(shareUrl);
        alert("Link copied to clipboard!");
     }
  };

  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-3 sticky top-0 z-50">
      <div className="flex items-center gap-4 text-primary dark:text-slate-100">
        <div className="size-8 bg-primary rounded flex items-center justify-center text-white">
          <span className="material-symbols-outlined">flight_takeoff</span>
        </div>
        <h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-tight">
          {t("title")}
        </h2>
      </div>
      <div className="flex flex-1 justify-end gap-8">
        <div className="flex gap-2">
          <button
            onClick={toggleTheme}
            className="flex size-10 cursor-pointer items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors"
            title={t("theme")}
          >
            <span className="material-symbols-outlined text-xl">
              {isDark ? "light_mode" : "dark_mode"}
            </span>
          </button>
          <button
            onClick={toggleLanguage}
            className="flex px-3 h-10 cursor-pointer items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors gap-2"
            title={t("language")}
          >
            <span className="material-symbols-outlined text-xl">language</span>
            <span className="text-xs font-bold uppercase">{locale}</span>
          </button>
          <button
            onClick={handleShare}
            className="flex size-10 cursor-pointer items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors"
            title={t("share")}
          >
            <span className="material-symbols-outlined text-xl">share</span>
          </button>
          <button
            className="flex px-4 h-10 cursor-pointer items-center justify-center rounded-lg bg-[#FFDD00] text-black hover:bg-[#FFDD00]/90 transition-colors gap-2 font-bold text-sm"
            title={t("coffee")}
          >
            <span className="material-symbols-outlined text-xl">coffee</span>
            <span className="hidden sm:inline">{t("coffee")}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
