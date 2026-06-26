import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, IBM_Plex_Mono, Noto_Sans_Hebrew } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import Script from "next/script";
import { routing } from "@/i18n/routing";
import { AppShell } from "@/components/app-shell";
import { getCurrentUser } from "@/features/accounts";
import "../globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});
const notoSansHebrew = Noto_Sans_Hebrew({
  subsets: ["hebrew"],
  variable: "--font-hebrew",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Theraper",
  description: "AI-guided therapist matching & booking.",
};

// Apply the persisted (or system) theme before paint to avoid a flash.
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const dir = locale === "he" ? "rtl" : "ltr";
  const user = await getCurrentUser();

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${inter.variable} ${plexMono.variable} ${notoSansHebrew.variable}`}
      suppressHydrationWarning
    >
      <body>
        <Script id="theme-init" strategy="beforeInteractive">
          {THEME_SCRIPT}
        </Script>
        <NextIntlClientProvider>
          <AppShell locale={locale} authedRole={user?.role ?? null} />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
