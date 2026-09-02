import type { LocaleId } from "@/i18n/config";
import en, { type Dictionary } from "@/i18n/dictionaries/en";
import zhHantHK from "@/i18n/dictionaries/zh-hk";

export type { Dictionary };

const dictionaries: Record<LocaleId, Dictionary> = {
  en,
  "zh-Hant-HK": zhHantHK,
};

export function getDictionary(locale: LocaleId): Dictionary {
  return dictionaries[locale];
}
