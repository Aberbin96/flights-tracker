"use client";

import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { useTransition, useState, useEffect } from "react";
import { LocalClock } from "./LocalClock";
import { useTheme } from "next-themes";

export function Header() {
  const t = useTranslations("Dashboard");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);
  const { setTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  const toggleLanguage = () => {
    const nextLocale = locale === "en" ? "es" : "en";
    startTransition(() => {
      if (!pathname) return;
      const segments = pathname.split("/");
      if (segments.length > 1) {
        segments[1] = nextLocale;
      }
      const newPath = segments.join("/") || `/${nextLocale}`;
      router.replace(newPath);
    });
  };

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: "Radar de Vuelos Venezuela",
          url: shareUrl,
        })
        .catch(console.error);
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert("Link copied to clipboard!");
    }
  };

  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200/60 dark:border-slate-800 bg-white/80 backdrop-blur-md dark:bg-slate-900 px-6 py-3 sticky top-0 z-50">
      <div className="flex items-center gap-4 text-primary dark:text-slate-100">
        <div className="size-8 bg-primary rounded-lg flex items-center justify-center text-white shadow-sm shadow-primary/20">
          <span className="material-symbols-outlined">flight_takeoff</span>
        </div>
        <h2 className="text-slate-800 dark:text-white text-lg font-bold leading-tight tracking-tight">
          {t("title")} 🇻🇪
        </h2>
        <LocalClock />
      </div>
      <div className="flex flex-1 justify-end gap-8">
        <div className="flex gap-2">
          <a
            href={`/${locale}/about`}
            className="flex px-3 cursor-pointer items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/50 dark:border-transparent transition-all shadow-sm"
            title={t("theme")}
          >
            {t("aboutLink", { fallback: "About this project" })}
          </a>
          <button
            onClick={toggleTheme}
            className="flex size-10 cursor-pointer items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/50 dark:border-transparent transition-all shadow-sm"
            title={t("theme")}
          >
            <span className="material-symbols-outlined text-xl">
              {mounted && resolvedTheme === "dark" ? "light_mode" : "dark_mode"}
            </span>
          </button>
          <button
            onClick={toggleLanguage}
            className="flex px-3 h-10 cursor-pointer items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/50 dark:border-transparent transition-all shadow-sm gap-2"
            title={t("language")}
          >
            <span className="material-symbols-outlined text-xl">language</span>
            <span className="text-xs font-bold uppercase">{locale}</span>
          </button>
          <button
            onClick={handleShare}
            className="flex size-10 cursor-pointer items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/50 dark:border-transparent transition-all shadow-sm"
            title={t("share")}
          >
            <span className="material-symbols-outlined text-xl">share</span>
          </button>
          <button
            className="flex px-4 h-10 cursor-pointer items-center justify-center rounded-lg bg-[#FFDD00] text-black hover:bg-[#FFCC00] transition-colors gap-2 font-bold text-sm shadow-sm"
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
