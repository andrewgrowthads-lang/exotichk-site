/**
 * Single source of truth for supported locales.
 *
 * Adding a new locale means: add an entry here, add a dictionary in
 * `i18n/dictionaries/`, add the matching Sanity field to the `locale*`
 * object schemas, and add a thin route branch under `src/app/`. No
 * middleware, no runtime locale negotiation.
 */

export type LocaleId = "en" | "zh-Hant-HK";

export interface LocaleConfig {
  /** BCP-47 identifier used internally and as the `<html lang>` value. */
  readonly id: LocaleId;
  /**
   * URL path prefix segment, e.g. "zh-hk". `null` for the default locale,
   * which is served with no prefix at all (`/`, not `/en/`).
   */
  readonly urlSegment: string | null;
  /**
   * Sanity object field key for this locale. Must be a valid camelCase
   * identifier because Sanity field names cannot contain hyphens.
   */
  readonly sanityField: string;
  /**
   * Value used in `<link rel="alternate" hreflang>`. Deliberately not
   * always identical to `id`: search engines reliably support
   * language or language+region, but frequently ignore the
   * language+script+region form, so `zh-Hant-HK` content advertises
   * itself as `zh-Hant` in hreflang while keeping the fuller value in
   * `<html lang>`.
   */
  readonly hreflang: string;
  /** Open Graph locale uses Facebook's language_REGION form. */
  readonly openGraphLocale: string;
  /** Label shown for this locale's fields in the Sanity Studio. */
  readonly label: string;
  /** Short label for the "EN | 中文" language switcher — kept separate from `label` since Studio field titles favour clarity over brevity. */
  readonly shortLabel: string;
  /** Exactly one locale must be the default (unprefixed, x-default). */
  readonly isDefault: boolean;
}

export const locales: readonly LocaleConfig[] = [
  {
    id: "en",
    urlSegment: null,
    sanityField: "en",
    hreflang: "en",
    openGraphLocale: "en_HK",
    label: "English",
    shortLabel: "EN",
    isDefault: true,
  },
  {
    id: "zh-Hant-HK",
    urlSegment: "zh-hk",
    sanityField: "zhHantHK",
    hreflang: "zh-Hant",
    openGraphLocale: "zh_HK",
    label: "繁體中文",
    shortLabel: "中文",
    isDefault: false,
  },
];

export const defaultLocale: LocaleConfig = locales.find((locale) => locale.isDefault)!;

export function getLocale(id: LocaleId): LocaleConfig {
  const locale = locales.find((entry) => entry.id === id);
  if (!locale) {
    throw new Error(`Unknown locale: ${id}`);
  }
  return locale;
}

export function getLocaleByUrlSegment(segment: string): LocaleConfig | undefined {
  return locales.find((locale) => locale.urlSegment === segment);
}
