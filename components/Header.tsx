"use client";

import { useTranslations } from "next-intl";
import { Plane, Moon, Languages, Share2, Coffee } from "lucide-react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function Header() {
  const t = useTranslations("Index");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const toggleLanguage = () => {
    const nextLocale = locale === "en" ? "es" : "en";
    startTransition(() => {
      const currentPath = window.location.pathname;
      const segments = currentPath.split("/");
      if (segments[1] === locale) {
         segments[1] = nextLocale;
      } else {
         // Handle edge case where locale might not be first segment if running locally without base path,
         // but standard next-intl setup usually has it as first segment.
         // Fallback to simple replacement or just reload with new prefix if complicated.
         // For now assume standard /locale/... structure
         segments[1] = nextLocale;
      }
      const newPath = segments.join("/");
      router.replace(newPath);
    });
  };

  // Placeholder for theme toggle as we don't have a theme context yet
  const toggleTheme = () => {
      // Logic to toggle theme class on html element or use a theme provider
      document.documentElement.classList.toggle('dark');
  };

  return (
    <header className="sticky top-0 z-50 bg-primary text-white p-4 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Plane className="text-white w-6 h-6" />
          <h1 className="text-lg font-bold tracking-tight">Vzla Flight Radar</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-1 hover:bg-white/10 rounded-full transition-colors"
            aria-label="Toggle Dark Mode"
          >
            <Moon className="text-white w-5 h-5" />
          </button>
          <button
            onClick={toggleLanguage}
            className="p-1 hover:bg-white/10 rounded-full transition-colors"
            aria-label="Toggle Language"
            disabled={isPending}
          >
            <Languages className="text-white w-5 h-5" />
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-white/10 pt-3">
        <div className="flex gap-2">
          <button className="flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-white/20 transition-colors">
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </div>
        <button className="flex items-center gap-2 bg-[#FFDD00] text-primary px-4 py-1.5 rounded-lg text-sm font-bold shadow-sm hover:bg-[#ffe44d] transition-colors">
          <Coffee className="w-4 h-4" />
          Buy Coffee
        </button>
      </div>
    </header>
  );
}
