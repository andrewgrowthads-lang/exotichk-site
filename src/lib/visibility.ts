import { locales, type LocaleId } from "@/i18n/config";
import type { LocalizedText } from "@/types/content";

/**
 * The single source of truth for "is this content visible on the public
 * site, in this locale". Every consumer — page components,
 * `generateStaticParams`, the sitemap, hreflang generation, and the
 * language switcher — must call this instead of re-deriving the same
 * logic. Duplicating these checks per-query is exactly how a listing and
 * the sitemap drift apart.
 */

export const PUBLISHED_STATUS = {
  country: ["active"],
  district: ["active"],
  profile: ["active", "temporarilyUnavailable"],
} as const;

export type ContentType = keyof typeof PUBLISHED_STATUS;

/** GROQ fragment for the cheap part of visibility: excluding archived documents at query time. */
export function statusFilter(type: ContentType): string {
  const statuses = PUBLISHED_STATUS[type].map((status) => `"${status}"`).join(", ");
  return `status in [${statuses}]`;
}

export function hasLocalizedText(value: LocalizedText | undefined, locale: LocaleId): boolean {
  const config = locales.find((entry) => entry.id === locale);
  if (!config || !value) return false;
  const text = value[config.sanityField as keyof LocalizedText];
  return typeof text === "string" && text.trim().length > 0;
}

export interface VisibilityInput {
  type: ContentType;
  status: string;
  /** Localized title / display name field. */
  title?: LocalizedText;
  /** Localized intro or summary field — the minimum required body content. */
  intro?: LocalizedText;
  locale: LocaleId;
}

/**
 * Whether a document should be rendered, listed, and indexed for the
 * given locale. English is expected to always satisfy this because it is
 * required at the CMS validation layer; non-default locales fall back to
 * `false` (and therefore a 404 / omission from sitemap+hreflang) until an
 * editor fills in the minimum translation.
 */
export function isVisible(input: VisibilityInput): boolean {
  const allowedStatuses = PUBLISHED_STATUS[input.type] as readonly string[];
  if (!allowedStatuses.includes(input.status)) {
    return false;
  }
  if (!hasLocalizedText(input.title, input.locale)) {
    return false;
  }
  if (!hasLocalizedText(input.intro, input.locale)) {
    return false;
  }
  return true;
}

/**
 * Both `active` and `temporarilyUnavailable` are indexable (`index,follow`)
 * as long as they are visible; only `archived` (and incomplete
 * translations) are excluded. There is deliberately no separate
 * "indexable" predicate — indexability is not a fourth independent
 * mechanism, it is a direct consequence of visibility.
 */
export const isIndexable = isVisible;
