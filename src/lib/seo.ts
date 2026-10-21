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
/**
 * `countries` are the titles available in the page's own language, so the
 * Chinese homepage never advertises a country it can only link to in
 * English. With none, the title falls back to the brand alone.
 */
export function homeSeoTitle({ locale, siteName, countries }: { locale: LocaleId; siteName: string; countries: string[] }): string {
  if (countries.length === 0) return siteName;
  return locale === "zh-Hant-HK"
    ? `${siteName}｜${countries.join("及")}個人檔案`
    : `${siteName} | ${countries.join(" & ")} Profiles`;
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

/** Homepage copy must not duplicate any country page's CMS intro verbatim. */
export function homeSeoDescription(locale: LocaleId, countries: string[]): string {
  if (locale === "zh-Hant-HK") {
    return countries.length > 0
      ? `選擇${countries.join("或")}，按地區瀏覽個人檔案，並直接透過 WhatsApp 或 Telegram 聯絡當地客戶經理。`
      : "選擇地區，按地區瀏覽個人檔案，並直接透過 WhatsApp 或 Telegram 聯絡當地客戶經理。";
  }
  return countries.length > 0
    ? `Choose ${countries.join(" or ")} to browse profiles by district and contact the local manager directly on WhatsApp or Telegram.`
    : "Choose your location to browse profiles by district and contact the local manager directly on WhatsApp or Telegram.";
}
