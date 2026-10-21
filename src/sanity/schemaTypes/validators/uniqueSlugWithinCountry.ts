import type { SlugIsUniqueValidator, SlugRule } from "sanity";

type SlugDocument = {
  _id?: string;
  country?: { _ref?: string };
};

async function checkSlugIsUniqueWithinCountry(
  documentType: "district" | "profile",
  slug: string,
  document: SlugDocument | undefined,
  getClient: Parameters<SlugIsUniqueValidator>[1]["getClient"],
) {
  const countryRef = document?.country?._ref;
  if (!countryRef || !document?._id) return true;

  const publishedId = document._id.replace(/^drafts\./, "");
  const count = await getClient({ apiVersion: "2026-01-01" }).fetch<number>(
    `count(*[
      _type == $type &&
      slug.current == $slug &&
      country._ref == $countryRef &&
      !(_id in [$publishedId, "drafts." + $publishedId])
    ])`,
    { type: documentType, slug, countryRef, publishedId },
  );
  return count === 0;
}

export function slugIsUniqueWithinCountry(documentType: "district" | "profile"): SlugIsUniqueValidator {
  return (slug, context) =>
    checkSlugIsUniqueWithinCountry(
      documentType,
      slug,
      context.document as SlugDocument | undefined,
      context.getClient,
    );
}

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
      const isUnique = await checkSlugIsUniqueWithinCountry(
        documentType,
        slug.current,
        context.document as SlugDocument | undefined,
        context.getClient,
      );
      return isUnique || "This slug is already used by another document within the same country.";
    });
}
