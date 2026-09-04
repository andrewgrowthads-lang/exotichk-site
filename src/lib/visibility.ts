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
 * Every locale for which `isVisible` holds, in `i18n/config.ts` order.
 * The one place that turns the per-locale predicate above into the
 * locale *lists* consumed by hreflang, the sitemap, and the language
 * switcher — so those three can never drift apart from each other or
 * from what a page actually renders.
 */
export function visibleLocalesFor(input: Omit<VisibilityInput, "locale">): LocaleId[] {
  return locales.filter((locale) => isVisible({ ...input, locale: locale.id })).map((locale) => locale.id);
}

/**
 * Typed `VisibilityInput` builders, one per entity shape. Every page,
 * listing, and the sitemap should build their check through these
 * instead of assembling the `{ type, status, title, intro }` shape by
 * hand — that hand-assembly is exactly what let listings drift from the
 * sitemap before (see module doc comment).
 */
type Visibility = Omit<VisibilityInput, "locale">;

export function countryVisibility(entity: { status: string; title?: LocalizedText; intro?: LocalizedText }): Visibility {
  return { type: "country", status: entity.status, title: entity.title, intro: entity.intro };
}

export function districtVisibility(entity: { status: string; title?: LocalizedText; intro?: LocalizedText }): Visibility {
  return { type: "district", status: entity.status, title: entity.title, intro: entity.intro };
}

/**
 * `displayName` is not itself localized (shown as-is in both languages —
 * see `sanity/schemaTypes/documents/profile.ts`), so it can never be the
 * thing that makes a profile invisible in a locale; it is duplicated
 * into both keys purely so `isVisible`'s generic title check passes
 * whenever a real title would. The short description (`summary`) is the
 * only field that actually gates a profile's translation.
 */
export function profileVisibility(entity: { status: string; displayName: string; summary?: LocalizedText }): Visibility {
  return {
    type: "profile",
    status: entity.status,
    title: { en: entity.displayName, zhHantHK: entity.displayName },
    intro: entity.summary,
  };
}

/**
 * Both `active` and `temporarilyUnavailable` are indexable (`index,follow`)
 * as long as they are visible; only `archived` (and incomplete
 * translations) are excluded. There is deliberately no separate
 * "indexable" predicate — indexability is not a fourth independent
 * mechanism, it is a direct consequence of visibility.
 */
export const isIndexable = isVisible;

export interface ListingVisibilityInput extends VisibilityInput {
  /**
   * How many profiles this listing actually renders in this locale —
   * i.e. the length of the array after `isVisible` has been applied to
   * every candidate. Locale matters: a profile with no Chinese summary
   * is invisible in `zh-Hant-HK`, so the same district can hold content
   * in one locale and be empty in the other.
   */
  visibleProfileCount: number;
}

/**
 * Whether a country/district listing should be indexed and advertised in
 * the sitemap. A visible listing with zero profiles is thin content: a
 * heading, breadcrumbs and one intro paragraph wrapped around an empty
 * grid. It stays reachable and keeps its full hreflang set — a visitor
 * switching language must still land on the translated URL — but Google
 * must neither index it nor be pointed at it.
 *
 * This is the single predicate behind all three consumers: the `robots`
 * directive built in `generateMetadata`, the on-page empty state, and
 * `sitemap.ts`. Re-deriving "is this listing worth indexing" separately
 * per consumer is precisely how a page ends up `index,follow` in its own
 * HTML while being absent from the sitemap, or the reverse.
 */
export function isListingIndexable(input: ListingVisibilityInput): boolean {
  return isVisible(input) && input.visibleProfileCount > 0;
}
