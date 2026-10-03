import { useState } from "react";
import { type DocumentActionComponent, useClient, useDocumentOperation } from "sanity";

type ProfileStatus = "active" | "archived";

interface ProfileDocument {
  status?: string;
}

export function ArchiveRestoreProfileAction(
  props: Parameters<DocumentActionComponent>[0],
): ReturnType<DocumentActionComponent> {
  const client = useClient({ apiVersion: "2026-01-01" });
  const { patch, publish } = useDocumentOperation(props.id, props.type);
  const [busy, setBusy] = useState(false);
  const published = props.published as ProfileDocument | null;
  const status = published?.status;

  if (props.type !== "profile" || (status !== "active" && status !== "archived")) {
    return null;
  }

  const nextStatus: ProfileStatus = status === "active" ? "archived" : "active";
  const archiving = nextStatus === "archived";
  const hasUnpublishedChanges = Boolean(props.draft);

  return {
    label: busy
      ? archiving
        ? "Archiving…"
        : "Restoring…"
      : archiving
        ? "Archive profile"
        : "Restore profile",
    tone: archiving ? "critical" : "positive",
    disabled: busy || !props.ready || hasUnpublishedChanges,
    title: hasUnpublishedChanges
      ? "Publish or discard the current draft changes first."
      : archiving
        ? "Remove this profile from the public catalogue without deleting it."
        : "Return this profile to the public catalogue.",
    onHandle: async () => {
      if (archiving && !window.confirm("Archive this profile and remove it from the public website?")) {
        props.onComplete();
        return;
      }

      setBusy(true);
      try {
        patch.execute([{ set: { status: nextStatus } }]);
        await waitForDraftStatus(client, props.id, nextStatus);
        publish.execute();
      } finally {
        setBusy(false);
        props.onComplete();
      }
    },
  };
}

async function waitForDraftStatus(
  client: ReturnType<typeof useClient>,
  documentId: string,
  status: ProfileStatus,
): Promise<void> {
  const draftId = `drafts.${documentId.replace(/^drafts\./, "")}`;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const draftStatus = await client.fetch<string | null>(`*[_id == $draftId][0].status`, { draftId });
    if (draftStatus === status) return;
    await new Promise((resolve) => window.setTimeout(resolve, 100));
  }
  throw new Error(`Timed out waiting to ${status === "archived" ? "archive" : "restore"} profile.`);
}
