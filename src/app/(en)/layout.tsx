import type { Metadata } from "next";
import { Geist } from "next/font/google";
import type { ReactNode } from "react";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { env } from "@/lib/env";
import "@/app/globals.css";

/**
 * This is a *route group* root layout (`app/(en)/layout.tsx`), not
 * `app/layout.tsx`. Next.js only allows one component per route to set
 * `<html lang>`, and English and Traditional Chinese need different
 * values with no middleware and no client-side mutation. Route groups
 * give each locale its own root layout while leaving every URL
 * unchanged: `(en)` does not appear in any path.
 */

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
};

export default function EnglishRootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} antialiased`}>
      <body
        className="flex min-h-screen flex-col bg-[var(--background)] text-[var(--foreground)]"
        style={{ fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif" }}
      >
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
