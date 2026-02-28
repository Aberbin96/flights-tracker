"use client";

import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useTransition, useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Icon } from "@/components/atoms/Icon";
import { Button } from "@/components/atoms/Button";

export default function AboutPage() {
  const t = useTranslations("About");
  const tDash = useTranslations("Dashboard");
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

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-6 md:p-12 font-sans selection:bg-primary/20 transition-colors duration-300">
      <div className="max-w-3xl mx-auto space-y-12">
        {/* Header Navigation & Controls */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <Link href="/">
            <Button variant="ghost" className="group">
              <Icon
                name="arrow_back"
                className="mr-2 transition-transform group-hover:-translate-x-1"
              />
              {t("backHome")}
            </Button>
          </Link>

          <div className="flex items-center gap-2">
            <Button
              onClick={toggleTheme}
              variant="icon"
              title={tDash("theme")}
              className="shadow-sm"
            >
              <Icon
                name={
                  mounted && resolvedTheme === "dark"
                    ? "light_mode"
                    : "dark_mode"
                }
                className="text-xl"
              />
            </Button>
            <Button
              onClick={toggleLanguage}
              variant="icon"
              title={tDash("language")}
              className="shadow-sm"
            >
              <Icon name="language" className="text-xl" />
              <span className="text-xs font-bold uppercase ml-1">{locale}</span>
            </Button>
          </div>
        </header>

        {/* Hero Section */}
        <section className="space-y-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-slate-800 dark:text-white">
              {t("title")}
            </h1>
            <div className="h-1.5 w-24 bg-primary rounded-full" />
          </div>
        </section>

        {/* Content Sections */}
        <div className="grid gap-6">
          {/* Mission */}
          <section className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-8 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <div className="p-4 bg-primary/10 dark:bg-primary/20 rounded-2xl text-primary shrink-0">
                <Icon name="verified_user" className="text-3xl" />
              </div>
              <div className="space-y-3">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                  {t("missionTitle")}
                </h2>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-lg">
                  {t("missionText")}
                </p>
              </div>
            </div>
          </section>

          {/* Methodology */}
          <section className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-8 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <div className="p-4 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-2xl text-emerald-600 dark:text-emerald-400 shrink-0">
                <Icon name="analytics" className="text-3xl" />
              </div>
              <div className="space-y-3">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                  {t("methodologyTitle")}
                </h2>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-lg">
                  {t("methodologyText")}
                </p>
              </div>
            </div>
          </section>

          {/* Disclaimer */}
          <section className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-8 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm hover:shadow-md transition-all border-dashed">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <div className="p-4 bg-amber-500/10 dark:bg-amber-500/20 rounded-2xl text-amber-600 dark:text-amber-400 shrink-0">
                <Icon name="gavel" className="text-3xl" />
              </div>
              <div className="space-y-3">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                  {t("disclaimerTitle")}
                </h2>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-lg italic">
                  {t("disclaimerText")}
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Improved Footer Info */}
        <footer className="pt-12 pb-12 border-t border-slate-200 dark:border-slate-800 text-center space-y-2">
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
            © {new Date().getFullYear()} {t("title").toLowerCase()}
          </p>
          <p className="text-slate-400 dark:text-slate-500 text-xs">
            {t("disclaimerTitle")} • {t("backHome")}
          </p>
        </footer>
      </div>
    </main>
  );
}
