"use client";

import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { useTransition, useState, useEffect } from "react";
import { LocalClock } from "./LocalClock";
import { useTheme } from "next-themes";
import { Button } from "./atoms/Button";
import { Icon } from "./atoms/Icon";
import { Tooltip } from "./atoms/Tooltip";

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
      alert(t("copySuccess"));
    }
  };

  return (
    <header className="flex flex-wrap items-center bg-white/80 backdrop-blur-md dark:bg-slate-900 px-4 sm:px-6 py-3 sticky top-0 z-50 border-b border-solid border-slate-200/60 dark:border-slate-800">
      {/* 1. Logo & Title (Top Left) */}
      <div className="flex items-center gap-2 sm:gap-3 text-primary dark:text-slate-100">
        <div className="size-8 shrink-0 bg-primary rounded-lg flex items-center justify-center text-white shadow-sm shadow-primary/20">
          <Icon name="flight_takeoff" />
        </div>
        <h2 className="text-slate-800 dark:text-white text-[15px] sm:text-lg font-bold leading-tight tracking-tight">
          {t("title")} 🇻🇪
        </h2>
        <div className="hidden lg:block">
          <LocalClock />
        </div>
      </div>

      {/* 2. Global Actions: Theme, Lang, Share (Mobile Top Right, Desktop Far Right) */}
      <div className="flex items-center gap-1 order-2 lg:order-3 ml-auto lg:ml-0">
        <Button onClick={toggleTheme} variant="icon" title={t("theme")}>
          <Icon
            name={
              mounted && resolvedTheme === "dark" ? "light_mode" : "dark_mode"
            }
            className="text-xl"
          />
        </Button>
        <Button onClick={toggleLanguage} variant="icon" title={t("language")}>
          <Icon name="language" className="text-xl" />
          <span className="text-xs font-bold uppercase ml-1 sm:ml-2">
            {locale}
          </span>
        </Button>
        <Button onClick={handleShare} variant="icon" title={t("share")}>
          <Icon name="share" className="text-xl" />
        </Button>
      </div>

      {/* 3. Filter & About (Mobile Bottom Row, Desktop Middle Right) */}
      <div className="flex items-center gap-2 w-full lg:w-auto order-3 lg:order-2 mt-3 lg:mt-0 pt-3 lg:pt-0 border-t border-slate-200/60 dark:border-slate-800 lg:border-none lg:ml-auto lg:mr-4">
        {/* Mobile Filter Toggle */}
        <Button
          className="lg:hidden flex-1 flex justify-center items-center gap-2 px-3 h-10"
          onClick={() =>
            document.dispatchEvent(new CustomEvent("toggleSidebar"))
          }
          variant="secondary"
          title={t("filters")}
        >
          <Icon name="filter_list" className="text-xl" />
          <span className="text-sm font-bold tracking-wide">
            {t("filters")}
          </span>
        </Button>

        <a
          href={`/${locale}/about`}
          className="flex-1 lg:flex-none flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/50 dark:border-transparent transition-all shadow-sm h-10 lg:h-9 px-4"
        >
          <Icon name="info" className="text-xl" />
          <span className="text-sm font-bold lg:hidden tracking-wide">
            {t("info")}
          </span>
        </a>
      </div>
    </header>
  );
}
