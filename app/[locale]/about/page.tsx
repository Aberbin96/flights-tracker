import { useTranslations } from "next-intl";
import { Coffee, ArrowLeft, Info, ShieldAlert, Activity } from "lucide-react";
import Link from "next/link";

export default function AboutPage() {
  const t = useTranslations("About");

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 p-6 md:p-12 font-sans">
      <div className="max-w-3xl mx-auto space-y-12">
        {/* Header */}
        <header>
          <Link
            href="/"
            className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("backHome")}
          </Link>
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            {t("title")}
          </h1>
        </header>

        {/* Content Sections */}
        <div className="space-y-8">
          {/* Mission */}
          <section className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                <Info className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-2">
                  {t("missionTitle")}
                </h2>
                <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {t("missionText")}
                </p>
              </div>
            </div>
          </section>

          {/* Methodology */}
          <section className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-2">
                  {t("methodologyTitle")}
                </h2>
                <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {t("methodologyText")}
                </p>
              </div>
            </div>
          </section>

          {/* Disclaimer */}
          <section className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-2">
                  {t("disclaimerTitle")}
                </h2>
                <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {t("disclaimerText")}
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Support Section */}
        <div className="text-center pt-8 border-t border-zinc-200 dark:border-zinc-800">
          <h3 className="text-lg font-medium mb-4">{t("supportTitle")}</h3>
          <p className="text-zinc-500 mb-6">{t("supportText")}</p>
          <a
            href="https://www.buymeacoffee.com/yourusername" // Placeholder
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#FFDD00] text-black font-bold rounded-full hover:opacity-90 transition-opacity"
          >
            <Coffee className="w-5 h-5" />
            {t("buyCoffee")}
          </a>
        </div>
      </div>
    </main>
  );
}
