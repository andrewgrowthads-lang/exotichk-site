import { useState } from "react";
import { type DocumentActionComponent, useClient, useDocumentOperation } from "sanity";
import {
  collectEnglish,
  hasManualChinese,
  requestTranslation,
  translationPatch,
  type TranslatableProfile,
} from "@/sanity/lib/translateProfile";

export function GenerateChineseAction(
  props: Parameters<DocumentActionComponent>[0],
): ReturnType<DocumentActionComponent> {
  const client = useClient({ apiVersion: "2026-01-01" });
  const { patch } = useDocumentOperation(props.id, props.type);
  const [busy, setBusy] = useState(false);
  const doc = (props.draft ?? props.published) as TranslatableProfile | null;

  if (props.type !== "profile") return null;

  const english = collectEnglish(doc);
  const disabled = busy || !props.ready || !english.summary;

  return {
    label: busy ? "Translating…" : "Generate / Update 中文",
    disabled,
    title: disabled && !busy ? "Add an English description first." : "Translate English copy without publishing.",
    onHandle: async () => {
      if (!doc || !english.summary) return;
      setBusy(true);
      try {
        if (await hasManualChinese(doc, english)) {
          const ok = window.confirm(
            "Chinese contains manual edits.\n\nOK = Update translation\nCancel = Keep Chinese",
          );
          if (!ok) return;
        }

        const token = client.config().token;
        if (!token) {
          window.alert("Could not read the Sanity session. Sign in again and retry.");
          return;
        }

        const result = await requestTranslation(
          process.env.SANITY_STUDIO_SITE_URL || "http://localhost:3000",
          token,
          english,
        );
        if (!result.ok) {
          window.alert(result.error || "Translation failed. English and existing Chinese were not changed.");
          return;
        }

        const sets = await translationPatch(doc, english, result.fields);
        patch.execute([{ set: sets }]);
      } catch {
        window.alert("Translation failed. English and existing Chinese were not changed.");
      } finally {
        setBusy(false);
        props.onComplete();
      }
    },
  };
}
