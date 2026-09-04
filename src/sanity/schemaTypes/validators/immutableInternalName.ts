import type { StringRule } from "sanity";

/**
 * Once an internal ID has been saved (draft or published) it cannot be
 * edited. Generation happens once at document creation via initialValue.
 */
export function immutableInternalName() {
  return (rule: StringRule) =>
    rule.custom(async (value, context) => {
      if (!value) return true;
      const document = context.document as { _id?: string } | undefined;
      if (!document?._id) return true;

      const publishedId = document._id.replace(/^drafts\./, "");
      const client = context.getClient({ apiVersion: "2026-01-01" });
      const saved = await client.fetch<string | null>(
        `coalesce(*[_id == $draftId][0].internalName, *[_id == $publishedId][0].internalName)`,
        { draftId: document._id, publishedId },
      );
      return (
        !saved ||
        saved === value ||
        "The internal ID is assigned automatically and cannot be changed."
      );
    });
}
