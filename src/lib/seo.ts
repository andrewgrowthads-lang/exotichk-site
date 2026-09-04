import type { LocaleId } from "@/i18n/config";

interface LocationSeoInput {
  locale: LocaleId;
  siteName: string;
  country: string;
  district?: string;
  profile?: string;
}

/**
 * Deterministic fallback titles keep every route distinct even when an
 * editor leaves the optional Sanity SEO override empty. Overrides remain
 * available for editorial nuance; these templates deliberately stay short
 * and factual rather than manufacturing keyword variants.
 */
export function homeSeoTitle({ locale, siteName, country }: LocationSeoInput): string {
  return locale === "zh-Hant-HK"
    ? `${siteName}｜${country}個人檔案`
    : `${siteName} | ${country} Profiles`;
}

export function countrySeoTitle({ locale, siteName, country }: LocationSeoInput): string {
  return locale === "zh-Hant-HK"
    ? `${country}個人檔案｜${siteName}`
    : `${country} Profiles | ${siteName}`;
}

export function districtSeoTitle({ locale, siteName, country, district }: LocationSeoInput): string {
  return locale === "zh-Hant-HK"
    ? `${district}個人檔案，${country}｜${siteName}`
    : `${district} Profiles, ${country} | ${siteName}`;
}

export function profileSeoTitle({ locale, siteName, country, district, profile }: LocationSeoInput): string {
  return locale === "zh-Hant-HK"
    ? `${profile}－${district}，${country}｜${siteName}`
    : `${profile} in ${district}, ${country} | ${siteName}`;
}

/** Homepage copy must not duplicate the country page's CMS intro verbatim. */
export function homeSeoDescription(locale: LocaleId, country: string): string {
  return locale === "zh-Hant-HK"
    ? `瀏覽${country}個人檔案，按地區探索，並直接透過 WhatsApp 或 Telegram 聯絡客戶經理。`
    : `Browse profiles across ${country}, explore by district, and contact the manager directly on WhatsApp or Telegram.`;
}
