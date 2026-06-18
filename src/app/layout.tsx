import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Manrope, Public_Sans, Noto_Sans_Hebrew } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const publicSans = Public_Sans({
  subsets: ["latin"],
  variable: "--font-public-sans",
  display: "swap",
});

const notoSansHebrew = Noto_Sans_Hebrew({
  subsets: ["hebrew"],
  variable: "--font-hebrew",
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Serene Path",
  description: "Find the right therapist and meet on-platform.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${publicSans.variable} ${notoSansHebrew.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
