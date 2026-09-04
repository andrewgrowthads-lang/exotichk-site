import type { SlugRule } from "sanity";

/**
 * Prevents an editor from publishing a slug change after a document has
 * already gone live. URL migrations must be performed explicitly in code
 * together with their redirects, rather than accidentally through Studio.
 */
export function immutablePublishedSlug() {
  return (rule: SlugRule) =>
    rule.custom(async (slug, context) => {
      if (!slug?.current) return true;
      const document = context.document as { _id?: string } | undefined;
      if (!document?._id) return true;

      const publishedId = document._id.replace(/^drafts\./, "");
      const client = context.getClient({ apiVersion: "2026-01-01" });
      const published = await client.fetch<{ slug?: { current?: string } } | null>(
        `*[_id == $publishedId][0]{ slug }`,
        { publishedId },
      );
      const publishedSlug = published?.slug?.current;

      return (
        !publishedSlug ||
        publishedSlug === slug.current ||
        "A published slug cannot be changed in Studio. Add reviewed 301 redirects and perform the migration in code."
      );
    });
}
