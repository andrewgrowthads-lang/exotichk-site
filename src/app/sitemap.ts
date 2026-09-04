import type { MetadataRoute } from "next";
import { locales, type LocaleId } from "@/i18n/config";
import {
  countryVisibility,
  districtVisibility,
  isListingIndexable,
  isVisible,
  profileVisibility,
  visibleLocalesFor,
} from "@/lib/visibility";
import { absoluteUrl, countryPath, districtPath, homePath, profilePath } from "@/lib/urls";
import { getAllCountries, getAllDistricts, getAllProfiles } from "@/sanity/queries";
import type { ProfileIndexEntry } from "@/types/content";

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
  if (visibleLocales.includes("en")) {
    map["x-default"] = absoluteUrl(pathFor("en"));
  }
  return map;
}

/**
 * hreflang sitemap syntax requires one `<url>` row per canonical locale
 * URL, with the same complete alternate set repeated on every row.
 * Emitting only the default locale as `<loc>` leaves translated canonical
 * pages undiscoverable as first-class sitemap entries.
 *
 * The two locale lists are deliberately distinct. `listedLocales` decides
 * which URLs the sitemap actually submits and drops thin listings;
 * `alternateLocales` stays the full *visible* set so the hreflang cluster
 * keeps matching what each page renders in its own `<head>`. Narrowing
 * the alternates too would silently rewrite the hreflang logic as a side
 * effect of a thin-content rule.
 */
function localizedEntries(
  pathFor: (locale: LocaleId) => string,
  listedLocales: LocaleId[],
  alternateLocales: LocaleId[],
  lastModified: Date,
): MetadataRoute.Sitemap {
  const languages = languageMap(pathFor, alternateLocales);
  return listedLocales.map((locale) => ({
    url: absoluteUrl(pathFor(locale)),
    lastModified,
    alternates: { languages },
  }));
}

/**
 * Groups the profile index the same way `getProfilesForCountry` and
 * `getProfilesForDistrict` scope their queries, so the counts fed to
 * `isListingIndexable` here are the counts the corresponding page will
 * actually render. `getAllProfiles` already applies the same status and
 * relationship filters as both of those queries, so grouping is enough —
 * no second round trip and no second definition of "listed here".
 */
function groupProfiles(profiles: ProfileIndexEntry[]) {
  const byCountry = new Map<string, ProfileIndexEntry[]>();
  const byDistrict = new Map<string, ProfileIndexEntry[]>();

  for (const profile of profiles) {
    const countryKey = profile.country.slug;
    const districtKey = `${countryKey}/${profile.district.slug}`;
    byCountry.set(countryKey, [...(byCountry.get(countryKey) ?? []), profile]);
    byDistrict.set(districtKey, [...(byDistrict.get(districtKey) ?? []), profile]);
  }

  const countIn = (bucket: ProfileIndexEntry[] | undefined, locale: LocaleId): number =>
    (bucket ?? []).filter((profile) => isVisible({ ...profileVisibility(profile), locale })).length;

  return {
    countryProfileCount: (countrySlug: string, locale: LocaleId) => countIn(byCountry.get(countrySlug), locale),
    districtProfileCount: (countrySlug: string, districtSlug: string, locale: LocaleId) =>
      countIn(byDistrict.get(`${countrySlug}/${districtSlug}`), locale),
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [countries, districts, profiles] = await Promise.all([
    getAllCountries(),
    getAllDistricts(),
    getAllProfiles(),
  ]);

  // A district or profile's URL contains its country's slug, so a locale
  // cannot be considered published for either unless the country is
  // published in that locale too — otherwise the sitemap would list a
  // `/zh-hk/...` URL whose own country page 404s in Chinese.
  const countryLocales = new Map<string, LocaleId[]>(
    countries.map((country) => [country.slug, visibleLocalesFor(countryVisibility(country))]),
  );
  const { countryProfileCount, districtProfileCount } = groupProfiles(profiles);

  const homeCountry = countries[0];
  const homeLocales = homeCountry ? (countryLocales.get(homeCountry.slug) ?? []) : [];
  const entries: MetadataRoute.Sitemap = localizedEntries(
    homePath,
    homeLocales,
    homeLocales,
    homeCountry?.updatedAt ? new Date(homeCountry.updatedAt) : new Date(),
  );

  for (const country of countries) {
    const visible = countryLocales.get(country.slug) ?? [];
    if (visible.length === 0) continue;
    const listed = visible.filter((locale) =>
      isListingIndexable({
        ...countryVisibility(country),
        locale,
        visibleProfileCount: countryProfileCount(country.slug, locale),
      }),
    );
    if (listed.length === 0) continue;
    entries.push(
      ...localizedEntries(
        (locale) => countryPath(country.slug, locale),
        listed,
        visible,
        new Date(country.updatedAt),
      ),
    );
  }

  for (const district of districts) {
    const parentVisible = countryLocales.get(district.country.slug) ?? [];
    const visible = visibleLocalesFor(districtVisibility(district)).filter((locale) => parentVisible.includes(locale));
    if (visible.length === 0) continue;
    const listed = visible.filter((locale) =>
      isListingIndexable({
        ...districtVisibility(district),
        locale,
        visibleProfileCount: districtProfileCount(district.country.slug, district.slug, locale),
      }),
    );
    if (listed.length === 0) continue;
    entries.push(
      ...localizedEntries(
        (locale) => districtPath(district.country.slug, district.slug, locale),
        listed,
        visible,
        new Date(district.updatedAt),
      ),
    );
  }

  for (const profile of profiles) {
    if (profile.seoNoIndex) continue;
    const parentVisible = countryLocales.get(profile.country.slug) ?? [];
    const visible = visibleLocalesFor(profileVisibility(profile)).filter((locale) => parentVisible.includes(locale));
    if (visible.length === 0) continue;
    entries.push(
      ...localizedEntries(
        (locale) => profilePath(profile.country.slug, profile.slug, locale),
        visible,
        visible,
        new Date(profile.updatedAt),
      ),
    );
  }

  return entries;
}
