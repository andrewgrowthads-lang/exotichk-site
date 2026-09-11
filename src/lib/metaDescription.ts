import type { LocaleId } from "@/i18n/config";
import type { LocalizedText } from "@/types/content";

/**
 * Fallback meta-description generation for profile pages.
 *
 * Editors can always set an explicit `seoDescription`; this module only
 * decides what to emit when they have not. It works on the free-text
 * fields as written — no keywords are added, no copy is invented — and
 * it never touches what the page renders: the visible body stays
 * untouched, only the `<meta name="description">` value is derived here.
 *
 * Rules:
 * 1. Split the text into sentences.
 * 2. Drop leading greeting-only sentences ("Greetings!", "Hello!", "你好！")
 *    — they carry no information and, taken alone, produce useless
 *    duplicate snippets.
 * 3. Keep whole sentences while they fit the locale's SERP budget.
 * 4. If that leaves a very short result, add the next sentence and cut it
 *    at a word boundary with an ellipsis rather than shipping a
 *    one-line description.
 */

interface LengthBudget {
  /** Upper bound; Google truncates around here on desktop and mobile. */
  max: number;
  /** Below this the description is considered too short to stand alone. */
  min: number;
}

const BUDGETS: Record<LocaleId, LengthBudget> = {
  // Latin text: Google shows ~155–160 characters.
  en: { max: 160, min: 100 },
  // CJK text is roughly twice as dense per character.
  "zh-Hant-HK": { max: 80, min: 40 },
};

const GREETING_EN =
  /^(?:greetings|hello|hi|hey|hiya|hi there|hello there|hey there|welcome|good (?:morning|afternoon|evening|day))(?:\s+(?:everyone|everybody|there|all|gentlemen|dear|guys))?[\s,!.…~]*$/i;

const GREETING_ZH = /^(?:你好|您好|你們好|您們好|大家好|哈囉|哈羅|嗨|問候|歡迎)[\s！!。.…~]*$/;

function isZh(locale: LocaleId): boolean {
  return locale === "zh-Hant-HK";
}

/** Splits on sentence-ending punctuation; keeps the punctuation attached. */
export function splitSentences(text: string, locale: LocaleId): string[] {
  const normalized = text.trim().replace(/\s+/g, " ");
  if (!normalized) return [];
  const parts = isZh(locale)
    ? normalized.split(/(?<=[。！？!?.])\s*/)
    : normalized.split(/(?<=[.!?…])\s+/);
  return parts.map((part) => part.trim()).filter(Boolean);
}

export function isGreetingOnly(sentence: string, locale: LocaleId): boolean {
  const trimmed = sentence.trim();
  if (!trimmed) return true;
  return isZh(locale) ? GREETING_ZH.test(trimmed) : GREETING_EN.test(trimmed);
}

/** Cuts `text` to at most `max` characters at a word boundary, appending an ellipsis. */
export function clampAtWordBoundary(text: string, max: number, locale: LocaleId): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  const room = max - 1; // leave space for the ellipsis
  let cut = trimmed.slice(0, room);
  if (!isZh(locale)) {
    const lastSpace = cut.lastIndexOf(" ");
    // Only back up to a word boundary when it does not throw away most of the budget.
    if (lastSpace > room * 0.6) cut = cut.slice(0, lastSpace);
  }
  cut = cut.replace(/[\s,;:、，；：\-–—]+$/u, "");
  return `${cut}…`;
}

/**
 * Derives a SERP-sized description from free text, or returns "" when the
 * text has nothing usable (empty, or greetings only).
 */
export function deriveMetaDescription(text: string | undefined, locale: LocaleId): string {
  if (!text) return "";
  const budget = BUDGETS[locale];
  const sentences = splitSentences(text, locale);

  let start = 0;
  while (start < sentences.length && isGreetingOnly(sentences[start], locale)) start += 1;
  const meaningful = sentences.slice(start);
  if (meaningful.length === 0) return "";

  const joiner = isZh(locale) ? "" : " ";
  let result = "";
  let index = 0;
  for (; index < meaningful.length; index += 1) {
    const candidate = result ? `${result}${joiner}${meaningful[index]}` : meaningful[index];
    if (candidate.length > budget.max) break;
    result = candidate;
  }

  if (!result) {
    // The very first meaningful sentence alone exceeds the budget.
    return clampAtWordBoundary(meaningful[0], budget.max, locale);
  }
  if (result.length < budget.min && index < meaningful.length) {
    // Too short to stand alone: continue into the next sentence and cut cleanly.
    return clampAtWordBoundary(`${result}${joiner}${meaningful[index]}`, budget.max, locale);
  }
  return result;
}

interface ProfileDescriptionSource {
  seoDescription?: LocalizedText;
  body?: LocalizedText;
  summary?: LocalizedText;
}

function localeValue(text: LocalizedText | undefined, locale: LocaleId): string | undefined {
  if (!text) return undefined;
  const value = isZh(locale) ? text.zhHantHK : text.en;
  return value?.trim() || undefined;
}

/**
 * Meta description for a profile page in the given locale.
 *
 * Precedence: explicit `seoDescription` (verbatim — editorial override) →
 * derived from the locale's body → derived from the locale's summary →
 * the raw summary (last resort, preserves the previous behaviour so a
 * page never ships without a description).
 */
export function profileMetaDescription(profile: ProfileDescriptionSource, locale: LocaleId): string {
  const explicit = localeValue(profile.seoDescription, locale);
  if (explicit) return explicit;

  const fromBody = deriveMetaDescription(localeValue(profile.body, locale), locale);
  if (fromBody) return fromBody;

  const fromSummary = deriveMetaDescription(localeValue(profile.summary, locale), locale);
  if (fromSummary) return fromSummary;

  return localeValue(profile.summary, locale) ?? profile.summary?.en?.trim() ?? "";
}
