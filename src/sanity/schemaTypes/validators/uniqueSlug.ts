import type { SlugRule } from "sanity";

/** Global slug uniqueness for document types with no parent scope (countries). */
export function uniqueSlug(documentType: string) {
  return (rule: SlugRule) =>
    rule.custom(async (slug, context) => {
      if (!slug?.current) return true;
      const document = context.document as { _id?: string } | undefined;
      if (!document?._id) return true;

      const client = context.getClient({ apiVersion: "2026-01-01" });
      const publishedId = document._id.replace(/^drafts\./, "");
      const count = await client.fetch<number>(
        `count(*[
          _type == $type &&
          slug.current == $slug &&
          !(_id in [$publishedId, "drafts." + $publishedId])
        ])`,
        { type: documentType, slug: slug.current, publishedId },
      );
      return count === 0 || "This slug is already used by another document of the same type.";
    });
}
