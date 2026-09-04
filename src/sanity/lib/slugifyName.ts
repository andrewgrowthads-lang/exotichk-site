/**
 * URL slug from a display name. Matches the conservative Sanity default
 * (lowercase, hyphenated, ASCII-ish) so auto-generated slugs stay stable
 * and short enough for `maxLength: 64`.
 */
export function slugifyName(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}
