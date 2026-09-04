import type { StringRule } from "sanity";

export function uniqueInternalName() {
  return (rule: StringRule) =>
    rule.custom(async (value, context) => {
      if (!value) return true;
      const document = context.document as { _id?: string } | undefined;
      if (!document?._id) return true;

      const publishedId = document._id.replace(/^drafts\./, "");
      const client = context.getClient({ apiVersion: "2026-01-01" });
      const count = await client.fetch<number>(
        `count(*[
          _type == "profile" &&
          internalName == $value &&
          !(_id in [$publishedId, "drafts." + $publishedId])
        ])`,
        { value, publishedId },
      );
      return count === 0 || "This internal ID is already used by another profile.";
    });
}
