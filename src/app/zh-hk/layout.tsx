import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { env } from "@/lib/env";
import "@/app/globals.css";

/**
 * Root layout for the `/zh-hk/*` branch — see the comment in
 * `app/(en)/layout.tsx` for why this is a second root layout rather than
 * a nested one.
 *
 * Deliberately does not load a CJK web font: Traditional Chinese font
 * files run into the megabytes, which would wreck LCP on the mobile
 * connections this catalog's Hong Kong audience actually uses. The
 * system font stack below is effectively free.
 */

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
};

/** See `app/(en)/layout.tsx` — each root layout owns its own viewport, and both locales serve the same sticky CTA. */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const CJK_SYSTEM_FONT_STACK =
  '"PingFang HK", "Microsoft JhengHei", "Noto Sans HK", ui-sans-serif, system-ui, sans-serif';

export default function ChineseRootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-Hant-HK" className="antialiased">
      <body
        className="flex min-h-screen flex-col bg-[var(--background)] text-[var(--foreground)]"
        style={{ fontFamily: CJK_SYSTEM_FONT_STACK }}
      >
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
