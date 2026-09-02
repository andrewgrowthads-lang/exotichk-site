import type { MetadataRoute } from "next";
import { locales, type LocaleId } from "@/i18n/config";
import { isVisible, type ContentType } from "@/lib/visibility";
import { absoluteUrl, countryPath, districtPath, homePath, profilePath } from "@/lib/urls";
import { getAllCountries, getAllDistricts, getAllProfiles } from "@/sanity/queries";
import type { LocalizedText } from "@/types/content";

/**
 * Every entry's `alternates.languages` includes the entry's *own*
 * locale. `next/sitemap` does not add that self-reference automatically,
 * and Google discards an entire hreflang set that lacks it — this is
 * the one rule in this file that must not be "simplified" away.
 */
function languageMap(pathFor: (locale: LocaleId) => string, visibleLocales: LocaleId[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const locale of visibleLocales) {
    const config = locales.find((entry) => entry.id === locale);
    if (!config) continue;
    map[config.hreflang] = absoluteUrl(pathFor(locale));
  }
  return map;
}

function visibleLocalesFor(type: ContentType, status: string, title: LocalizedText, intro: LocalizedText): LocaleId[] {
  return locales.filter((locale) => isVisible({ type, status, title, intro, locale: locale.id })).map((l) => l.id);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [countries, districts, profiles] = await Promise.all([
    getAllCountries(),
    getAllDistricts(),
    getAllProfiles(),
  ]);

  const entries: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl(homePath("en")),
      lastModified: new Date(),
      alternates: { languages: languageMap((l) => homePath(l), locales.map((l) => l.id)) },
    },
  ];

  for (const country of countries) {
    const visible = visibleLocalesFor("country", country.status, country.title, country.intro);
    if (visible.length === 0) continue;
    entries.push({
      url: absoluteUrl(countryPath(country.slug, visible[0])),
      lastModified: new Date(country.updatedAt),
      alternates: { languages: languageMap((l) => countryPath(country.slug, l), visible) },
    });
  }

  for (const district of districts) {
    const visible = visibleLocalesFor("district", district.status, district.title, district.intro);
    if (visible.length === 0) continue;
    entries.push({
      url: absoluteUrl(districtPath(district.country.slug, district.slug, visible[0])),
      lastModified: new Date(district.updatedAt),
      alternates: {
        languages: languageMap((l) => districtPath(district.country.slug, district.slug, l), visible),
      },
    });
  }

  for (const profile of profiles) {
    const visible = visibleLocalesFor(
      "profile",
      profile.status,
      { en: profile.displayName, zhHantHK: profile.displayName },
      profile.summary,
    );
    if (visible.length === 0) continue;
    entries.push({
      url: absoluteUrl(profilePath(profile.country.slug, profile.slug, visible[0])),
      lastModified: new Date(profile.updatedAt),
      alternates: {
        languages: languageMap((l) => profilePath(profile.country.slug, profile.slug, l), visible),
      },
    });
  }

  return entries;
}
