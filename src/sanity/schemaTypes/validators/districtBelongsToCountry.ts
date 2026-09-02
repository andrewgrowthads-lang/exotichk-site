import type { ReferenceRule } from "sanity";

/**
 * A profile references both `country` and `district` directly (rather
 * than deriving country from the district) so that queries stay a single
 * hop. This validator is what keeps the two references from silently
 * drifting apart in the editorial UI.
 */
export function districtBelongsToCountry() {
  return (rule: ReferenceRule) =>
    rule.custom(async (districtRef, context) => {
      const document = context.document as { country?: { _ref?: string } } | undefined;
      const countryRef = document?.country?._ref;
      if (!districtRef?._ref || !countryRef) return true;

      const client = context.getClient({ apiVersion: "2026-01-01" });
      const district = await client.fetch<{ countryRef?: string } | null>(
        `*[_id == $id][0]{ "countryRef": country._ref }`,
        { id: districtRef._ref },
      );
      if (!district) return true;
      return district.countryRef === countryRef || "Selected district does not belong to the selected country.";
    });
}
