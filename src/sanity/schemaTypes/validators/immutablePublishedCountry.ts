import type { ReferenceRule } from "sanity";

/**
 * A published profile's URL contains its country slug, and its price and
 * contacts follow the country. Moving it in Studio would silently 404 the
 * old URL and switch currency, so the country is fixed once published —
 * same policy as `immutablePublishedSlug`.
 */
export function immutablePublishedCountry() {
  return (rule: ReferenceRule) =>
    rule.custom(async (value, context) => {
      const ref = (value as { _ref?: string } | undefined)?._ref;
      if (!ref) return true;
      const document = context.document as { _id?: string } | undefined;
      if (!document?._id) return true;

      const publishedId = document._id.replace(/^drafts\./, "");
      const published = await context
        .getClient({ apiVersion: "2026-01-01" })
        .fetch<{ ref?: string } | null>(`*[_id == $publishedId][0]{ "ref": country._ref }`, { publishedId });

      return (
        !published?.ref ||
        published.ref === ref ||
        "This profile is already published in another country. Create a new profile in the new country instead."
      );
    });
}
