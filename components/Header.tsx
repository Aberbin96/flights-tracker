"use client";

import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { useTransition, useState, useEffect } from "react";
import { LocalClock } from "./LocalClock";
import { useTheme } from "next-themes";
import { Button } from "./atoms/Button";
import { Icon } from "./atoms/Icon";

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
          <Icon name="flight_takeoff" />
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
            title={t("aboutLink", { fallback: "About this project" })}
          >
            <Icon name="info" className="text-xl" />
          </a>
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
            <span className="text-xs font-bold uppercase ml-2">{locale}</span>
          </Button>
          <Button onClick={handleShare} variant="icon" title={t("share")}>
            <Icon name="share" className="text-xl" />
          </Button>
        </div>
      </div>
    </header>
  );
}
