import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return {
    title: t("title"),
    description: t("description"),
    keywords: t("keywords"),
    openGraph: {
      title: t("title"),
      description: t("description"),
      type: "website",
      locale: locale,
      siteName: "Radar de Vuelos Venezuela",
      images: [
        {
          url: "/opengraph-image.png",
          width: 1200,
          height: 630,
          alt: t("title"),
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
      images: ["/opengraph-image.png"],
    },
  };
}

import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { supabase } from "@/utils/supabase/client";
import { TRACKED_AIRPORTS } from "@/constants/flights";

// Fetch distinct origin airports for the filter using the view
async function getAirports() {
  return TRACKED_AIRPORTS;
}

// Fetch distinct airlines for the filter using the view
async function getAirlines() {
  const { data, error } = await supabase
    .from("distinct_airlines_view")
    .select("airline");

  if (error) {
    console.error("Error fetching airlines from view:", error);
    return [];
  }

  return data.map((item) => item.airline);
}

// Fetch min date for the calendar
async function getMinDate() {
  const { data, error } = await supabase
    .from("flights_history")
    .select("flight_date")
    .order("flight_date", { ascending: true })
    .limit(1);

  if (error || !data || data.length === 0) return "";
  return data[0].flight_date;
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  // Fetch data for the Sidebar
  const [airports, airlines, minDate] = await Promise.all([
    getAirports(),
    getAirlines(),
    getMinDate(),
  ]);

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <div className="bg-background-light dark:bg-background-dark h-[100dvh] flex flex-col font-display">
              <Header />
              <div className="flex flex-1 overflow-hidden">
                <Sidebar
                  airports={airports}
                  airlines={airlines}
                  minDate={minDate}
                />
                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                  {children}
                </main>
              </div>
            </div>
            <Analytics />
            <SpeedInsights />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
