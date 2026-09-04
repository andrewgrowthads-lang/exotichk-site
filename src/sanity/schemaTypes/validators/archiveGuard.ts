import type { StringRule } from "sanity";

/**
 * A country or district cannot be archived while a non-archived profile
 * still points to it — that would leave a published profile with no
 * visible parent page for its breadcrumb and district/country links.
 */
export function blockArchiveWithActiveProfiles(refField: "country" | "district") {
  return (rule: StringRule) =>
    rule.custom(async (status, context) => {
      if (status !== "archived") return true;
      const document = context.document as { _id?: string } | undefined;
      if (!document?._id) return true;

      const client = context.getClient({ apiVersion: "2026-01-01" });
      const publishedId = document._id.replace(/^drafts\./, "");
      const count = await client.fetch<number>(
        `count(*[
          _type == "profile" &&
          ${refField}._ref == $publishedId &&
          status != "archived"
        ])`,
        { publishedId },
      );
      return (
        count === 0 ||
        `${count} non-archived profile(s) still reference this ${refField === "country" ? "country" : "district"}. Archive or move them first.`
      );
    });
}
