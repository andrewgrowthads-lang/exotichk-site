import { locales, type LocaleId } from "@/i18n/config";

/**
 * With exactly two locales, "the other one" is unambiguous and the
 * language switcher can be a single link. If a third locale is added,
 * this — and the switcher UI — becomes a list instead of a toggle.
 */
export function otherLocale(current: LocaleId): LocaleId | undefined {
  return locales.find((locale) => locale.id !== current)?.id;
}
