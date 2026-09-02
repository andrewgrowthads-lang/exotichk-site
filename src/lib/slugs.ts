import { locales } from "@/i18n/config";

/** Segments that can never be used as a country or district slug. */
export const RESERVED_SEGMENTS = new Set([
  "profiles",
  "api",
  "studio",
  "_next",
  "robots.txt",
  "sitemap.xml",
  "favicon.ico",
  ...locales.map((locale) => locale.urlSegment).filter((segment): segment is string => Boolean(segment)),
]);

/** ASCII lowercase, digits and hyphens, no leading/trailing hyphen. */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidSlug(value: string): boolean {
  return SLUG_PATTERN.test(value) && !RESERVED_SEGMENTS.has(value);
}
