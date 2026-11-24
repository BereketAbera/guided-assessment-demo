import type { Metadata, Viewport } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import type { ReactNode } from "react";
import { HistoryGuard } from "@/components/history-guard";
import { SampleRibbon } from "@/components/sample-ribbon";
import { SiteFooter } from "@/components/site-footer";
import { settings } from "@/lib/settings";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const sourceSerif = Source_Serif_4({ subsets: ["latin"], variable: "--font-source-serif", display: "swap" });

const title = "Guided assessment: a working sample";
const description =
  "A working sample of a paid, guided self-assessment: access codes, one question at a time, resume with the same code, a report from one template, and an owner admin. Fictional data.";

/**
 * The site's own address, so a pasted link carries a full address for its preview picture. On the host it is
 * the project's production address; SITE_URL overrides it for a custom domain.
 */
const siteUrl =
  process.env.SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3601");

// The preview picture and the icons are files beside this one (opengraph-image.png, apple-icon.png,
// favicon.ico, icon.svg), drawn by the scripts in /design.
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: title, template: "%s · Guided assessment sample" },
  description,
  openGraph: { type: "website", siteName: settings.assessment.brand, title, description },
  twitter: { card: "summary_large_image", title, description },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FAF7F2",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${sourceSerif.variable}`}>
      <body className="flex min-h-dvh flex-col bg-paper text-ink">
        <a
          href="#main"
          className="no-print sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-ink focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        <HistoryGuard />
        <SampleRibbon />
        <div className="flex flex-1 flex-col">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
