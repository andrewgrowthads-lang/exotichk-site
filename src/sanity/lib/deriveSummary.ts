import { deriveMetaDescription } from "@/lib/metaDescription";

/**
 * Short English summary for visibility/SEO when the editor only wrote a
 * description. Shares its sentence logic with the page-level meta
 * description fallback, so a greeting-only opener ("Greetings!") is
 * skipped and the result is clamped to SERP length at a word boundary.
 */
export function deriveSummaryEn(description: string | undefined, displayName: string | undefined): string {
  const derived = deriveMetaDescription(description, "en");
  if (derived) return derived;
  const name = displayName?.trim() ?? "";
  return name || "Profile";
}
