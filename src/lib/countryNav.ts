import type { LocaleId } from "@/i18n/config";
import { countryPath, homePath } from "@/lib/urls";

/**
 * `/` is the brand catalogue for the default (first) country.
 * Other countries keep their own `/{slug}/` SEO URLs. The header switcher
 * uses this so adding Singapore later does not require query-parameter pages.
 */
export function countryNavHref(slug: string, homeCountrySlug: string | undefined, locale: LocaleId): string {
  return homeCountrySlug && slug === homeCountrySlug ? homePath(locale) : countryPath(slug, locale);
}
