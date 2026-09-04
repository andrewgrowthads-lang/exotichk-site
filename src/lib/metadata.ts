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
  socialImageAlt?: string;
  siteName?: string;
  /** Editorial override (`profile.seoNoIndex`) — keeps the page reachable but asks search engines not to index it. */
  noIndex?: boolean;
}

/**
 * Builds canonical + hreflang + Open Graph metadata for a single public
 * page. This is the only place that should construct these fields —
 * page components call it and return the result from `generateMetadata`.
 */
export function buildPageMetadata(input: PageMetadataInput): Metadata {
  const canonical = absoluteUrl(input.path);
  const currentLocale = locales.find((entry) => entry.id === input.locale);

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
    robots: input.noIndex
      ? { index: false, follow: true, googleBot: { index: false, follow: true } }
      : { index: true, follow: true },
    alternates: {
      canonical,
      languages,
    },
    openGraph: {
      title: input.title,
      description: input.description,
      url: canonical,
      siteName: input.siteName ?? "ExoticHK",
      type: "website",
      locale: currentLocale?.openGraphLocale,
      alternateLocale: input.alternates
        .filter((alternate) => alternate.locale !== input.locale)
        .map((alternate) => locales.find((entry) => entry.id === alternate.locale)?.openGraphLocale)
        .filter((locale): locale is string => Boolean(locale)),
      images: input.socialImageUrl
        ? [{ url: input.socialImageUrl, alt: input.socialImageAlt ?? input.title }]
        : undefined,
    },
    twitter: {
      card: input.socialImageUrl ? "summary_large_image" : "summary",
      title: input.title,
      description: input.description,
      images: input.socialImageUrl ? [input.socialImageUrl] : undefined,
    },
  };
}
