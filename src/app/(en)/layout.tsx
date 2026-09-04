import type { Metadata, Viewport } from "next";
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

/**
 * `viewportFit: "cover"` is what makes `env(safe-area-inset-*)` resolve to
 * anything other than `0px` on iOS. The sticky contact bar on profile
 * pages already pads itself with `env(safe-area-inset-bottom)`; without
 * this the padding silently collapses and the CTA — the only conversion
 * element on the site — sits under the home indicator. The other two
 * values restate Next.js' default so that declaring this export does not
 * quietly drop them.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
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
