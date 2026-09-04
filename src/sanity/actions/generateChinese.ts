import { useState } from "react";
import { type DocumentActionComponent, useClient, useDocumentOperation } from "sanity";
import { sha256Hex } from "@/sanity/lib/sha256Hex";
import {
  TRANSLATABLE_FIELDS,
  type TranslatableField,
} from "@/sanity/lib/translationFields";

type Localized = { en?: string; zhHantHK?: string };

type TranslationMeta = Partial<Record<`${TranslatableField}En` | `${TranslatableField}Zh`, string>>;

interface ProfileDoc {
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

export function GenerateChineseAction(props: Parameters<DocumentActionComponent>[0]): ReturnType<DocumentActionComponent> {
  const client = useClient({ apiVersion: "2026-01-01" });
  const { patch } = useDocumentOperation(props.id, props.type);
  const [busy, setBusy] = useState(false);
  const doc = (props.draft ?? props.published) as ProfileDoc | null;

  if (props.type !== "profile") return null;

  const english = collectEnglish(doc);
  const disabled = busy || !props.ready || !english.summary;

  return {
    label: busy ? "Translating…" : "Generate / Update 中文",
    tone: "primary",
    disabled,
    title: disabled && !busy ? "Add an English summary first." : "Translate English copy into Hong Kong Traditional Chinese.",
    onHandle: async () => {
      if (!doc || !english.summary) return;
      setBusy(true);
      try {
        const needsConfirm = await hasManualChinese(doc, english);
        if (needsConfirm) {
          const ok = window.confirm(
            "Some Chinese text was edited by hand. Replace it with a new translation from the current English?",
          );
          if (!ok) return;
        }

        const siteUrl = (process.env.SANITY_STUDIO_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
        const token = client.config().token;
        if (!token) {
          window.alert("Could not read the Sanity session. Sign in again and retry.");
          return;
        }

        const response = await fetch(`${siteUrl}/api/translate`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ fields: english }),
        });
        const result = (await response.json().catch(() => null)) as { fields?: Record<string, string>; error?: string } | null;
        if (!response.ok || !result?.fields) {
          window.alert(result?.error || "Translation failed. English and existing Chinese were not changed.");
          return;
        }

        const nextMeta: TranslationMeta = { ...(doc.translationMeta ?? {}) };
        const sets: Record<string, string> = {};
        for (const key of TRANSLATABLE_FIELDS) {
          const translated = result.fields[key];
          const source = english[key];
          if (!translated || !source) continue;
          sets[`${FIELD_PATH[key]}.zhHantHK`] = translated;
          nextMeta[`${key}En`] = await sha256Hex(source);
          nextMeta[`${key}Zh`] = await sha256Hex(translated);
        }
        patch.execute([{ set: { ...sets, translationMeta: nextMeta } }]);
      } catch {
        window.alert("Translation failed. English and existing Chinese were not changed.");
      } finally {
        setBusy(false);
        props.onComplete();
      }
    },
  };
}

function collectEnglish(doc: ProfileDoc | null): Partial<Record<TranslatableField, string>> {
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

async function hasManualChinese(
  doc: ProfileDoc,
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

function zhSource(doc: ProfileDoc, key: TranslatableField): Localized | undefined {
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

function localized(value: Localized | undefined, locale: keyof Localized): string {
  const text = value?.[locale];
  return typeof text === "string" ? text.trim() : "";
}
