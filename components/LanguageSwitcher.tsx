"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const toggleLanguage = () => {
    const nextLocale = locale === "en" ? "es" : "en";
    startTransition(() => {
      // In next-intl w/ Next.js App Router, switching locale usually involves just navigating
      // to the new path prefix.
      // However, we need to respect the current path.
      // A simple way is to replace the current locale segment in the pathname.
      const currentPath = window.location.pathname;
      const segments = currentPath.split("/");
      segments[1] = nextLocale;
      const newPath = segments.join("/");
      router.replace(newPath);
    });
  };

  return (
    <button
      onClick={toggleLanguage}
      disabled={isPending}
      className="flex items-center gap-2 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 px-3 py-2 rounded-md font-medium text-sm transition-opacity hover:opacity-90 disabled:opacity-50"
    >
      <Globe className="w-4 h-4" />
      {locale === "en" ? "ES" : "EN"}
    </button>
  );
}
