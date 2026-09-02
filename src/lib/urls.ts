import { defaultLocale, locales, type LocaleConfig, type LocaleId } from "@/i18n/config";
import { env } from "@/lib/env";

/** Segments that can never be used as a country or district slug. */
export const RESERVED_SEGMENTS = new Set([
  "profiles",
  "api",
  "studio",
  "_next",
  "robots.txt",
  "sitemap.xml",
  "favicon.ico",
  ...locales.map((locale) => locale.urlSegment).filter((segment): segment is string => Boolean(segment)),
]);

/** ASCII lowercase, digits and hyphens, no leading/trailing hyphen. */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidSlug(value: string): boolean {
  return SLUG_PATTERN.test(value) && !RESERVED_SEGMENTS.has(value);
}

function localePrefix(locale: LocaleConfig): string {
  return locale.urlSegment ? `/${locale.urlSegment}` : "";
}

export function homePath(locale: LocaleId = defaultLocale.id): string {
  const config = locales.find((entry) => entry.id === locale) ?? defaultLocale;
  return `${localePrefix(config)}/`;
}

export function countryPath(countrySlug: string, locale: LocaleId = defaultLocale.id): string {
  const config = locales.find((entry) => entry.id === locale) ?? defaultLocale;
  return `${localePrefix(config)}/${countrySlug}/`;
}

export function districtPath(
  countrySlug: string,
  districtSlug: string,
  locale: LocaleId = defaultLocale.id,
): string {
  const config = locales.find((entry) => entry.id === locale) ?? defaultLocale;
  return `${localePrefix(config)}/${countrySlug}/${districtSlug}/`;
}

export function profilePath(
  countrySlug: string,
  profileSlug: string,
  locale: LocaleId = defaultLocale.id,
): string {
  const config = locales.find((entry) => entry.id === locale) ?? defaultLocale;
  return `${localePrefix(config)}/${countrySlug}/profiles/${profileSlug}/`;
}

/** Absolute, self-referencing canonical URL for the given path. */
export function absoluteUrl(path: string): string {
  const base = env.siteUrl.replace(/\/$/, "");
  return `${base}${path}`;
}
