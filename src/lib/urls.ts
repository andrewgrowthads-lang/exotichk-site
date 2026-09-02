import { defaultLocale, locales, type LocaleConfig, type LocaleId } from "@/i18n/config";
import { env } from "@/lib/env";

export { RESERVED_SEGMENTS, isValidSlug } from "@/lib/slugs";

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
