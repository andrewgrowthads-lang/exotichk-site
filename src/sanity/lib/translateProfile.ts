import { sha256Hex } from "@/sanity/lib/sha256Hex";
import { TRANSLATABLE_FIELDS, type TranslatableField } from "@/sanity/lib/translationFields";

export type Localized = { en?: string; zhHantHK?: string };
export type TranslationMeta = Partial<Record<`${TranslatableField}En` | `${TranslatableField}Zh`, string>>;

export interface TranslatableProfile {
  summary?: Localized;
  body?: Localized;
  seoTitle?: Localized;
  seoDescription?: Localized;
  translationMeta?: TranslationMeta;
}

const FIELD_PATH: Record<TranslatableField, string> = {
  summary: "summary",
  body: "body",
  seoTitle: "seoTitle",
  seoDescription: "seoDescription",
};

export function localized(value: Localized | undefined, locale: keyof Localized): string {
  const text = value?.[locale];
  return typeof text === "string" ? text.trim() : "";
}

export function collectEnglish(doc: TranslatableProfile | null): Partial<Record<TranslatableField, string>> {
  if (!doc) return {};
  const fields: Partial<Record<TranslatableField, string>> = {};
  const summary = localized(doc.summary, "en");
  const body = localized(doc.body, "en");
  const seoTitle = localized(doc.seoTitle, "en");
  const seoDescription = localized(doc.seoDescription, "en");
  if (summary) fields.summary = summary;
  if (body) fields.body = body;
  if (seoTitle) fields.seoTitle = seoTitle;
  if (seoDescription) fields.seoDescription = seoDescription;
  return fields;
}

export async function hasManualChinese(
  doc: TranslatableProfile,
  english: Partial<Record<TranslatableField, string>>,
): Promise<boolean> {
  const meta = doc.translationMeta ?? {};
  for (const key of TRANSLATABLE_FIELDS) {
    if (!english[key]) continue;
    const currentZh = localized(zhSource(doc, key), "zhHantHK");
    if (!currentZh) continue;
    const storedZh = meta[`${key}Zh`];
    if (!storedZh) return true;
    if ((await sha256Hex(currentZh)) !== storedZh) return true;
  }
  return false;
}

function zhSource(doc: TranslatableProfile, key: TranslatableField): Localized | undefined {
  switch (key) {
    case "summary":
      return doc.summary;
    case "body":
      return doc.body;
    case "seoTitle":
      return doc.seoTitle;
    case "seoDescription":
      return doc.seoDescription;
  }
}

export async function requestTranslation(
  siteUrl: string,
  token: string,
  fields: Partial<Record<TranslatableField, string>>,
): Promise<{ ok: true; fields: Record<string, string> } | { ok: false; status: number; error: string }> {
  const response = await fetch(`${siteUrl.replace(/\/$/, "")}/api/translate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fields }),
  });
  const result = (await response.json().catch(() => null)) as { fields?: Record<string, string>; error?: string } | null;
  if (!response.ok || !result?.fields) {
    return { ok: false, status: response.status, error: result?.error || "Translation failed." };
  }
  return { ok: true, fields: result.fields };
}

export async function translationPatch(
  doc: TranslatableProfile,
  english: Partial<Record<TranslatableField, string>>,
  translated: Record<string, string>,
): Promise<Record<string, string | TranslationMeta>> {
  const nextMeta: TranslationMeta = { ...(doc.translationMeta ?? {}) };
  const sets: Record<string, string | TranslationMeta> = {};
  for (const key of TRANSLATABLE_FIELDS) {
    const text = translated[key];
    const source = english[key];
    if (!text || !source) continue;
    sets[`${FIELD_PATH[key]}.zhHantHK`] = text;
    nextMeta[`${key}En`] = await sha256Hex(source);
    nextMeta[`${key}Zh`] = await sha256Hex(text);
  }
  sets.translationMeta = nextMeta;
  return sets;
}
