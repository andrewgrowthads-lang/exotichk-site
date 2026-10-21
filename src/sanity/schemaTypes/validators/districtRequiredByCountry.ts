import type { ReferenceRule } from "sanity";

/**
 * District is required unless the profile's country has "Use districts"
 * switched off. An unset flag counts as on, so countries created before
 * the field existed keep requiring a district.
 */
export function districtRequiredByCountry() {
  return (rule: ReferenceRule) =>
    rule.custom(async (districtRef, context) => {
      if (districtRef?._ref) return true;
      const document = context.document as { country?: { _ref?: string } } | undefined;
      const countryRef = document?.country?._ref;
      if (!countryRef) return true;

      const useDistricts = await context
        .getClient({ apiVersion: "2026-01-01" })
        .fetch<boolean | null>(`*[_id == $id][0].useDistricts`, { id: countryRef });
      return useDistricts === false || "Required";
    });
}
