import { useState } from "react";
import { type DocumentActionComponent, useClient, useDocumentOperation } from "sanity";
import { usePublishValidation } from "@/sanity/actions/usePublishValidation";
import { scheduleCatalogRevalidate } from "@/sanity/lib/requestRevalidate";
import { resolveStudioToken } from "@/sanity/lib/studioToken";

/**
 * Default publish for countries, districts and site settings, followed by
 * the same best-effort catalogue refresh as Publish Profile — so a contact
 * or background change is live without waiting for the ISR window, even
 * if the Sanity webhook does not cover the document type.
 */
export function PublishAndRefreshAction(
  props: Parameters<DocumentActionComponent>[0],
): ReturnType<DocumentActionComponent> {
  const client = useClient({ apiVersion: "2026-01-01" });
  const { publish } = useDocumentOperation(props.id, props.type);
  const blocked = usePublishValidation(props);
  const [busy, setBusy] = useState(false);

  return {
    label: busy ? "Publishing…" : "Publish",
    tone: "positive",
    disabled: busy || !props.ready || !props.draft || Boolean(publish.disabled) || Boolean(blocked),
    title: publish.disabled ? String(publish.disabled) : (blocked ?? "Publish and refresh the website."),
    onHandle: async () => {
      setBusy(true);
      try {
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
