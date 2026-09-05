import { useState } from "react";
import { type DocumentActionComponent, useClient, useDocumentOperation } from "sanity";
import { deriveSummaryEn } from "@/sanity/lib/deriveSummary";
import { scheduleCatalogRevalidate } from "@/sanity/lib/requestRevalidate";
import { resolveStudioToken } from "@/sanity/lib/studioToken";
import {
  collectEnglish,
  hasManualChinese,
  localized,
  requestTranslation,
  translationPatch,
  type TranslatableProfile,
} from "@/sanity/lib/translateProfile";

interface ProfileDoc extends TranslatableProfile {
  displayName?: string;
}

export function PublishProfileAction(
  props: Parameters<DocumentActionComponent>[0],
): ReturnType<DocumentActionComponent> {
  const client = useClient({ apiVersion: "2026-01-01" });
  const { patch, publish } = useDocumentOperation(props.id, props.type);
  const [busy, setBusy] = useState(false);
  const doc = (props.draft ?? props.published) as ProfileDoc | null;

  if (props.type !== "profile") return null;

  return {
    label: busy ? "Publishing…" : "Publish Profile",
    tone: "positive",
    disabled: busy || !props.ready || Boolean(publish.disabled),
    title: publish.disabled ? String(publish.disabled) : "Translate (if available) and publish.",
    onHandle: async () => {
      if (!doc) return;
      setBusy(true);
      try {
        ensureSummary(patch, doc);

        const english = collectEnglish({
          ...doc,
          summary: {
            ...doc.summary,
            en: doc.summary?.en?.trim() || deriveSummaryEn(localized(doc.body, "en"), doc.displayName),
          },
        });

        const token = await resolveStudioToken(client);
        let translationFailed = false;
        if (english.summary && token) {
          let shouldTranslate = true;
          if (await hasManualChinese(doc, english)) {
            shouldTranslate = window.confirm(
              "Chinese contains manual edits.\n\nOK = Update translation\nCancel = Keep Chinese and publish",
            );
          }
          if (shouldTranslate) {
            const translated = await requestTranslation(token, english);
            if (translated.ok) {
              patch.execute([{ set: await translationPatch(doc, english, translated.fields) }]);
            } else {
              translationFailed = true;
            }
          }
        } else if (english.summary && !token) {
          window.alert("Could not read the Sanity session. Sign in again and retry.");
          return;
        }

        publish.execute();
        if (token) scheduleCatalogRevalidate(token);
        if (translationFailed) {
          window.alert("Published in English. Chinese pages stay hidden until translation succeeds.");
        }
      } catch {
        window.alert("Publish failed. The profile was not published.");
      } finally {
        setBusy(false);
        props.onComplete();
      }
    },
  };
}

export function PublishEnglishOnlyAction(
  props: Parameters<DocumentActionComponent>[0],
): ReturnType<DocumentActionComponent> {
  const client = useClient({ apiVersion: "2026-01-01" });
  const { patch, publish } = useDocumentOperation(props.id, props.type);
  const [busy, setBusy] = useState(false);
  const doc = (props.draft ?? props.published) as ProfileDoc | null;

  if (props.type !== "profile") return null;

  return {
    label: busy ? "Publishing…" : "Publish English only",
    disabled: busy || !props.ready || Boolean(publish.disabled),
    title: "Publish without translating. Chinese pages stay hidden until Chinese exists.",
    onHandle: async () => {
      if (!doc) return;
      setBusy(true);
      try {
        ensureSummary(patch, doc);
        publish.execute();
        const token = await resolveStudioToken(client);
        if (token) scheduleCatalogRevalidate(token);
      } finally {
        setBusy(false);
        props.onComplete();
      }
    },
  };
}

function ensureSummary(
  patch: ReturnType<typeof useDocumentOperation>["patch"],
  doc: ProfileDoc,
): void {
  if (doc.summary?.en?.trim()) return;
  const en = deriveSummaryEn(localized(doc.body, "en"), doc.displayName);
  patch.execute([
    {
      set: {
        summary: {
          _type: "localeText",
          en,
          ...(doc.summary?.zhHantHK ? { zhHantHK: doc.summary.zhHantHK } : {}),
        },
      },
    },
  ]);
}
