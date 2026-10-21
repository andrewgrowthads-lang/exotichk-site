/**
 * Public district labels for navigation chips, listing headings, and
 * profile cards. CMS `title` remains the source for SEO/metadata;
 * these strings are presentation-only and keyed by `{country}/{district}`
 * so a same-named district in another country never picks them up.
 */
const DISTRICT_PUBLIC_LABELS: Record<string, { nav: string; expanded: string }> = {
  "hong-kong/tst": { nav: "TST", expanded: "Tsim Sha Tsui (尖沙咀)" },
  "hong-kong/wan-chai": { nav: "Wan Chai", expanded: "Wan Chai (灣仔)" },
};

export function districtNavLabel(countrySlug: string, districtSlug: string, fallback: string): string {
  return DISTRICT_PUBLIC_LABELS[`${countrySlug}/${districtSlug}`]?.nav ?? fallback;
}

export function districtExpandedLabel(countrySlug: string, districtSlug: string, fallback: string): string {
  return DISTRICT_PUBLIC_LABELS[`${countrySlug}/${districtSlug}`]?.expanded ?? fallback;
}
