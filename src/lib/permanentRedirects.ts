/**
 * Code-reviewed redirect ledger for changed public slugs.
 *
 * Add one entry in each affected locale before publishing a slug change.
 * Country slug changes also need district/profile entries because the
 * country segment is part of every descendant URL. These are deliberately
 * static: Next.js can emit an exact HTTP 301 without making otherwise
 * pre-rendered catalog pages depend on a CMS lookup at request time.
 *
 * Example:
 * { source: "/hong-kong/profiles/old-name/", destination: "/hong-kong/profiles/new-name/" }
 */
export const permanentRedirects: readonly {
  source: string;
  destination: string;
}[] = [];
