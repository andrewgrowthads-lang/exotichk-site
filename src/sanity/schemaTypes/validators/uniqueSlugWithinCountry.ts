import type { SlugRule } from "sanity";

/**
 * District and profile slugs only need to be unique per country (not
 * globally): a profile has no `district` segment in its URL, so its
 * canonical path is `/{country}/profiles/{slug}/`, and a district's path
 * is `/{country}/{slug}/`.
 */
export function uniqueSlugWithinCountry(documentType: "district" | "profile") {
  return (rule: SlugRule) =>
    rule.custom(async (slug, context) => {
      if (!slug?.current) return true;
      const document = context.document as { _id?: string; country?: { _ref?: string } } | undefined;
      const countryRef = document?.country?._ref;
      if (!countryRef || !document?._id) return true;

      const client = context.getClient({ apiVersion: "2026-01-01" });
      const publishedId = document._id.replace(/^drafts\./, "");
      const count = await client.fetch<number>(
        `count(*[
          _type == $type &&
          slug.current == $slug &&
          country._ref == $countryRef &&
          !(_id in [$publishedId, "drafts." + $publishedId])
        ])`,
        { type: documentType, slug: slug.current, countryRef, publishedId },
      );
      return count === 0 || "This slug is already used by another document within the same country.";
    });
}
