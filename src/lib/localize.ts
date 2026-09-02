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
