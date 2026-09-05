/**
 * Public district labels for navigation chips, listing headings, and
 * profile cards. CMS `title` remains the source for SEO/metadata;
 * these strings are presentation-only and keyed by slug.
 */
const DISTRICT_PUBLIC_LABELS: Record<string, { nav: string; expanded: string }> = {
  tst: { nav: "TST", expanded: "Tsim Sha Tsui (尖沙咀)" },
  "wan-chai": { nav: "Wan Chai", expanded: "Wan Chai (灣仔)" },
};

export function districtNavLabel(slug: string, fallback: string): string {
  return DISTRICT_PUBLIC_LABELS[slug]?.nav ?? fallback;
}

export function districtExpandedLabel(slug: string, fallback: string): string {
  return DISTRICT_PUBLIC_LABELS[slug]?.expanded ?? fallback;
}
