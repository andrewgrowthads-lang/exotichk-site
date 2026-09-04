import type { ReferenceRule } from "sanity";

/**
 * Prevents moving a district to another country while public profiles still
 * reference the old relationship. Profile-level validation alone cannot see
 * edits made later to the district document.
 */
export function districtCountryHasNoProfileConflicts() {
  return (rule: ReferenceRule) =>
    rule.custom(async (countryRef, context) => {
      const document = context.document as { _id?: string } | undefined;
      if (!document?._id || !countryRef?._ref) return true;

      const districtId = document._id.replace(/^drafts\./, "");
      const selectedCountryId = countryRef._ref.replace(/^drafts\./, "");
      const client = context.getClient({ apiVersion: "2026-01-01" });
      const conflicts = await client.fetch<number>(
        `count(*[
          _type == "profile" &&
          district._ref == $districtId &&
          status != "archived" &&
          !(country._ref == $selectedCountryId)
        ])`,
        { districtId, selectedCountryId },
      );

      return (
        conflicts === 0 ||
        `${conflicts} non-archived profile(s) would point to a district in a different country. Move or archive them first.`
      );
    });
}
