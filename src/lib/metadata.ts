import type { Metadata } from "next";
import { defaultLocale, locales, type LocaleId } from "@/i18n/config";
import { absoluteUrl } from "@/lib/urls";

export interface AlternatePath {
  locale: LocaleId;
  path: string;
}

export interface PageMetadataInput {
  title: string;
  description: string;
  /** Path for the locale currently being rendered, e.g. from `pathBuilders`. */
  path: string;
  locale: LocaleId;
  /**
   * Paths for every locale that has a published, visible equivalent of
   * this page. Must include the current locale (self-reference) or the
   * hreflang set will be rejected wholesale by search engines.
   */
  alternates: AlternatePath[];
  socialImageUrl?: string;
}

/**
 * Builds canonical + hreflang + Open Graph metadata for a single public
 * page. This is the only place that should construct these fields —
 * page components call it and return the result from `generateMetadata`.
 */
export function buildPageMetadata(input: PageMetadataInput): Metadata {
  const canonical = absoluteUrl(input.path);

  const languages: Record<string, string> = {};
  for (const alternate of input.alternates) {
    const config = locales.find((locale) => locale.id === alternate.locale);
    if (!config) continue;
    languages[config.hreflang] = absoluteUrl(alternate.path);
  }
  const defaultAlternate = input.alternates.find((alt) => alt.locale === defaultLocale.id);
  if (defaultAlternate) {
    languages["x-default"] = absoluteUrl(defaultAlternate.path);
  }

  return {
    title: input.title,
    description: input.description,
    alternates: {
      canonical,
      languages,
    },
    openGraph: {
      title: input.title,
      description: input.description,
      url: canonical,
      siteName: "ExoticHK",
      images: input.socialImageUrl ? [{ url: input.socialImageUrl }] : undefined,
    },
  };
}
