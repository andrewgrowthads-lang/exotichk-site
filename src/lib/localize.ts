import { locales, type LocaleId } from "@/i18n/config";
import type { LocalizedText } from "@/types/content";

/**
 * Reads a `LocalizedText` field for the given locale, falling back to the
 * default locale's value if the requested locale has no text. Used for
 * secondary fields (SEO description, image alt) where a missing
 * translation should degrade gracefully instead of hiding content — the
 * page-level visibility check in `lib/visibility.ts` is what decides
 * whether the page exists at all.
 */
export function pickLocalizedText(text: LocalizedText | undefined, locale: LocaleId): string {
  if (!text) return "";
  const config = locales.find((entry) => entry.id === locale);
  const key = (config?.sanityField ?? "en") as keyof LocalizedText;
  return text[key] ?? text.en ?? "";
}

/**
 * `nationality`, `languages` and `attributes` (see `sanity/schemaTypes/documents/profile.ts`)
 * are plain English strings shared across locales rather than
 * `LocalizedText` objects — editors pick or type one value, not two. A
 * small closed set of common values gets a Chinese translation here;
 * anything outside it is shown untranslated rather than blocking the
 * page. This is a deliberate trade-off, not a gap to "complete": the
 * alternative is asking a non-technical editor to type Chinese for
 * every free-text field.
 */
function localizeFromMap(map: Record<string, string>, value: string, locale: LocaleId): string {
  if (locale === "zh-Hant-HK" && value in map) {
    return map[value];
  }
  return value;
}

const NATIONALITY_TRANSLATIONS_ZH: Record<string, string> = {
  "Hong Kong Chinese": "香港華人",
  "Mainland Chinese": "中國內地",
  Filipino: "菲律賓",
  Thai: "泰國",
  Vietnamese: "越南",
  Korean: "韓國",
  Japanese: "日本",
  Russian: "俄羅斯",
  Ukrainian: "烏克蘭",
};

export function localizeNationality(value: string, locale: LocaleId): string {
  return localizeFromMap(NATIONALITY_TRANSLATIONS_ZH, value, locale);
}

const LANGUAGE_TRANSLATIONS_ZH: Record<string, string> = {
  English: "英語",
  Cantonese: "廣東話",
  Mandarin: "普通話",
  Japanese: "日語",
  Korean: "韓語",
  Russian: "俄語",
  Ukrainian: "烏克蘭語",
  Thai: "泰語",
  Vietnamese: "越南語",
  Tagalog: "菲律賓語",
  French: "法語",
};

export function localizeLanguage(value: string, locale: LocaleId): string {
  return localizeFromMap(LANGUAGE_TRANSLATIONS_ZH, value, locale);
}

const ATTRIBUTE_TRANSLATIONS_ZH: Record<string, string> = {
  Slim: "纖瘦",
  Petite: "嬌小",
  Athletic: "運動型",
  Curvy: "豐滿",
};

export function localizeAttribute(value: string, locale: LocaleId): string {
  return localizeFromMap(ATTRIBUTE_TRANSLATIONS_ZH, value, locale);
}
