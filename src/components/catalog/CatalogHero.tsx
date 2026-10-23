import type { ReactNode } from "react";
import type { LocaleId } from "@/i18n/config";
import { CountryFlag } from "@/components/brand/CountryFlag";
import { CatalogFrame } from "@/components/layout/CatalogFrame";

/**
 * Catalogue heading + chips/grid slot. The city night image is not
 * painted here — PageShell's SiteAtmosphere is the single site-wide
 * background — so this is only the content that sits on top.
 */
export function CatalogHero({
  locationTitle,
  tagline,
  contextLine,
  locale,
  locationAs = "p",
  contextAs = "p",
  countrySlug,
  headingAside,
  children,
}: {
  locationTitle: string;
  tagline?: string;
  contextLine?: string;
  locale: LocaleId;
  locationAs?: "h1" | "p";
  contextAs?: "h1" | "p";
  /** Shows the country's flag beside the title when one is bundled. */
  countrySlug?: string;
  /** Optional country-specific action displayed beside the catalogue title. */
  headingAside?: ReactNode;
  children: ReactNode;
}) {
  const LocationTag = locationAs;
  const ContextTag = contextAs;
  const englishDisplay = locale === "en";

  return (
    <div className="relative">
      <CatalogFrame className="pt-5 pb-0 sm:pt-7 lg:pt-8">
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-6">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <CountryFlag
              slug={countrySlug}
              className="h-5 w-[30px] rounded-[3px] shadow-[0_0_18px_rgba(255,45,138,0.4)] ring-1 ring-[var(--accent)]/45 sm:h-6 sm:w-9"
            />
            <LocationTag
              className={`text-[28px] leading-none font-semibold text-white [text-shadow:0_2px_24px_rgba(0,0,0,0.85)] sm:text-[40px] lg:text-[48px] ${
                englishDisplay ? "tracking-[0.18em] uppercase" : "tracking-wide"
              }`}
            >
              {locationTitle}
            </LocationTag>
          </div>
          {headingAside}
        </div>
        {contextLine ? (
          <ContextTag className="mt-2.5 text-[14px] font-medium tracking-wide text-white/88 [text-shadow:0_1px_12px_rgba(0,0,0,0.8)] sm:text-[16px]">
            {contextLine}
          </ContextTag>
        ) : tagline ? (
          <p className="mt-2.5 text-[12px] tracking-[0.18em] text-[var(--accent-soft)] uppercase [text-shadow:0_1px_12px_rgba(0,0,0,0.8)] sm:text-[13px]">
            {tagline}
            <span className="mt-1.5 block h-px w-14 bg-[var(--accent)] shadow-[0_0_12px_var(--accent)]" aria-hidden="true" />
          </p>
        ) : null}
      </CatalogFrame>
      <CatalogFrame className="pt-4 pb-10 sm:pt-5">{children}</CatalogFrame>
    </div>
  );
}
