import { sanityClient } from "@/sanity/client";
import type { LocaleId } from "@/i18n/config";
import { isValidPathSegment, isValidSlug } from "@/lib/slugs";
import {
  countryVisibility,
  districtVisibility,
  isVisible,
  profileVisibility,
  statusFilter,
} from "@/lib/visibility";
import type {
  CountryDetail,
  CountrySummary,
  DistrictDetail,
  DistrictSummary,
  ProfileDetail,
  ProfileIndexEntry,
  ProfileSummary,
  SiteSettings,
} from "@/types/content";

/**
 * Every catalog read shares one revalidation tag. At 50-100 documents
 * there is no benefit to per-document tags — they only add bookkeeping
 * and a real gap: a profile moved between districts still needs *both*
 * the old and new listings invalidated, and the webhook payload has no
 * memory of the old district. One shared tag sidesteps that entirely.
 * Publish expires the tag immediately; the window below is a fallback.
 */
const CATALOG_TAG = "catalog";
const REVALIDATE_SECONDS = 30;
const profileRelationshipFilter =
  "defined(country->slug.current) && defined(district->slug.current) && district->country._ref == country._ref";

function fetchQuery<T>(query: string, params: Record<string, unknown> = {}): Promise<T> {
  return sanityClient.fetch<T>(query, params, {
    next: { revalidate: REVALIDATE_SECONDS, tags: [CATALOG_TAG] },
  });
}

const localizedTextProjection = `{ en, zhHantHK }`;

const imageProjection = `{
  asset -> { _ref, url, metadata { dimensions, lqip } },
  hotspot,
  crop,
  alt ${localizedTextProjection}
}`;

/** Editors see separate "main photo" and "gallery" fields; every reader
 * gets one ordered array with the main photo first — one merge point
 * instead of every consumer re-deriving photo order. */
const profileImagesProjection = `"images": array::compact([mainImage, ...(gallery[])])[]${imageProjection}`;
const profileCardImageProjection = `"images": array::compact([mainImage])[]${imageProjection}`;

const countryProjection = `{
  "_id": _id,
  "slug": slug.current,
  status,
  title ${localizedTextProjection},
  intro ${localizedTextProjection},
  body ${localizedTextProjection},
  image ${imageProjection},
  sortOrder,
  "updatedAt": _updatedAt,
  seoTitle ${localizedTextProjection},
  seoDescription ${localizedTextProjection},
}`;

const districtProjection = `{
  "_id": _id,
  "slug": slug.current,
  status,
  title ${localizedTextProjection},
  intro ${localizedTextProjection},
  body ${localizedTextProjection},
  image ${imageProjection},
  sortOrder,
  "updatedAt": _updatedAt,
  seoTitle ${localizedTextProjection},
  seoDescription ${localizedTextProjection},
  "country": country->{ "slug": slug.current },
}`;

const profileSummaryProjection = `{
  "_id": _id,
  "slug": slug.current,
  status,
  displayName,
  summary ${localizedTextProjection},
  ${profileCardImageProjection},
  "featured": coalesce(featured, false),
  "seoNoIndex": coalesce(seoNoIndex, false),
  sortOrder,
  "updatedAt": _updatedAt,
  "country": country->{ "slug": slug.current },
  "district": district->{ "slug": slug.current, title ${localizedTextProjection} },
  age,
  height,
  nationality,
  price,
}`;

const profileDetailProjection = `{
  ...${profileSummaryProjection},
  ${profileImagesProjection},
  internalName,
  body ${localizedTextProjection},
  age,
  height,
  nationality,
  languages,
  attributes,
  seoTitle ${localizedTextProjection},
  seoDescription ${localizedTextProjection},
  h1Override ${localizedTextProjection},
  ogImage ${imageProjection},
  unavailableMessage ${localizedTextProjection},
  publishedAt,
  "contact": { "telegramUrl": telegramUrl, "whatsappUrl": whatsappUrl, "telegramChannelUrl": telegramChannelUrl },
}`;

const profileIndexProjection = `{
  "_id": _id,
  "slug": slug.current,
  status,
  displayName,
  summary ${localizedTextProjection},
  "seoNoIndex": coalesce(seoNoIndex, false),
  "updatedAt": _updatedAt,
  "country": country->{ "slug": slug.current },
  "district": district->{ "slug": slug.current },
}`;

/** Featured profiles surface first within their listing; everything
 * else follows the editor-assigned sort order. */
const profileOrder = `order(status asc, featured desc, sortOrder asc)`;

export async function getSiteSettings(): Promise<SiteSettings | null> {
  return fetchQuery<SiteSettings | null>(
    `*[_type == "siteSettings"][0]{
      agencyName,
      agencyDescription ${localizedTextProjection},
      logo ${imageProjection},
      defaultSeoTitle ${localizedTextProjection},
      defaultSeoDescription ${localizedTextProjection},
      defaultSocialImage ${imageProjection},
      "contact": { "telegramUrl": telegramUrl, "whatsappUrl": whatsappUrl, "telegramChannelUrl": telegramChannelUrl },
    }`,
  );
}

export async function getCountries(): Promise<CountrySummary[]> {
  return fetchQuery<CountrySummary[]>(
    `*[_type == "country" && ${statusFilter("country")}] | order(sortOrder asc) ${countryProjection}`,
  );
}

export async function getCountryBySlug(slug: string): Promise<CountryDetail | null> {
  if (!isValidSlug(slug)) return null;
  return fetchQuery<CountryDetail | null>(
    `*[_type == "country" && slug.current == $slug && ${statusFilter("country")}][0] ${countryProjection}`,
    { slug },
  );
}

export async function getDistrictsForCountry(countrySlug: string): Promise<DistrictSummary[]> {
  return fetchQuery<DistrictSummary[]>(
    `*[_type == "district" && country->slug.current == $countrySlug && ${statusFilter(
      "district",
    )}] | order(sortOrder asc) ${districtProjection}`,
    { countrySlug },
  );
}

export async function getDistrictBySlug(
  countrySlug: string,
  districtSlug: string,
): Promise<DistrictDetail | null> {
  if (!isValidSlug(countrySlug) || !isValidSlug(districtSlug)) return null;
  return fetchQuery<DistrictDetail | null>(
    `*[_type == "district" && slug.current == $districtSlug && country->slug.current == $countrySlug && ${statusFilter(
      "district",
    )}][0] ${districtProjection}`,
    { countrySlug, districtSlug },
  );
}

export async function getProfilesForCountry(countrySlug: string): Promise<ProfileSummary[]> {
  return fetchQuery<ProfileSummary[]>(
    `*[_type == "profile" && country->slug.current == $countrySlug && ${profileRelationshipFilter} && ${statusFilter(
      "profile",
    )}] | ${profileOrder} ${profileSummaryProjection}`,
    { countrySlug },
  );
}

export async function getFeaturedProfilesForCountry(
  countrySlug: string,
  limit = 8,
): Promise<ProfileSummary[]> {
  return fetchQuery<ProfileSummary[]>(
    `*[
      _type == "profile" &&
      country->slug.current == $countrySlug &&
      featured == true &&
      ${profileRelationshipFilter} &&
      ${statusFilter("profile")}
    ] | ${profileOrder} [0...$limit] ${profileSummaryProjection}`,
    { countrySlug, limit },
  );
}

export async function getProfilesForDistrict(
  countrySlug: string,
  districtSlug: string,
): Promise<ProfileSummary[]> {
  return fetchQuery<ProfileSummary[]>(
    `*[_type == "profile" && country->slug.current == $countrySlug && district->slug.current == $districtSlug && ${profileRelationshipFilter} && ${statusFilter(
      "profile",
    )}] | ${profileOrder} ${profileSummaryProjection}`,
    { countrySlug, districtSlug },
  );
}

export async function getProfileBySlug(
  countrySlug: string,
  profileSlug: string,
): Promise<ProfileDetail | null> {
  if (!isValidSlug(countrySlug) || !isValidPathSegment(profileSlug)) return null;
  return fetchQuery<ProfileDetail | null>(
    `*[_type == "profile" && slug.current == $profileSlug && country->slug.current == $countrySlug && ${profileRelationshipFilter} && ${statusFilter(
      "profile",
    )}][0] ${profileDetailProjection}`,
    { countrySlug, profileSlug },
  );
}

/** Other profiles in the same country, for the "more profiles" section
 * on a profile page. Same country only — district is deliberately not
 * a factor, matching how listings themselves are scoped. */
export async function getSimilarProfiles(
  countrySlug: string,
  excludeProfileSlug: string,
  limit = 4,
): Promise<ProfileSummary[]> {
  return fetchQuery<ProfileSummary[]>(
    `*[_type == "profile" && country->slug.current == $countrySlug && slug.current != $excludeProfileSlug && ${profileRelationshipFilter} && ${statusFilter(
      "profile",
    )}] | ${profileOrder} [0...$limit] ${profileSummaryProjection}`,
    { countrySlug, excludeProfileSlug, limit },
  );
}

/** Every visible country/district/profile, for `sitemap.ts` and `generateStaticParams`. */
export async function getAllCountries(): Promise<CountrySummary[]> {
  return getCountries();
}

export async function getAllDistricts(): Promise<DistrictSummary[]> {
  return fetchQuery<DistrictSummary[]>(
    `*[_type == "district" && ${statusFilter("district")}] | order(sortOrder asc) ${districtProjection}`,
  );
}

export async function getAllProfiles(): Promise<ProfileIndexEntry[]> {
  return fetchQuery<ProfileIndexEntry[]>(
    `*[_type == "profile" && ${profileRelationshipFilter} && ${statusFilter(
      "profile",
    )}] | ${profileOrder} ${profileIndexProjection}`,
  );
}

/**
 * Shared `generateStaticParams` sources. Every one of the eight route
 * files (2 locales x 4 page types) calls these instead of writing its
 * own query, so a change to how "visible" is defined cannot drift
 * between locales or page types.
 *
 * Returns an empty list (rather than throwing) if Sanity is unreachable
 * during a build — a CMS outage should not be able to fail the build;
 * pages will simply render on demand instead (`dynamicParams` stays on).
 */
async function safely<T>(fn: () => Promise<T[]>): Promise<T[]> {
  try {
    return await fn();
  } catch {
    return [];
  }
}

export async function getCountryStaticParams(locale: LocaleId): Promise<{ country: string }[]> {
  const countries = await safely(getAllCountries);
  return countries
    .filter((country) => isVisible({ ...countryVisibility(country), locale }))
    .map((country) => ({ country: country.slug }));
}

export async function getDistrictStaticParams(locale: LocaleId): Promise<{ country: string; district: string }[]> {
  const [countries, districts] = await Promise.all([safely(getAllCountries), safely(getAllDistricts)]);
  const visibleCountries = new Set(
    countries.filter((country) => isVisible({ ...countryVisibility(country), locale })).map((country) => country.slug),
  );
  return districts
    .filter(
      (district) =>
        visibleCountries.has(district.country.slug) && isVisible({ ...districtVisibility(district), locale }),
    )
    .map((district) => ({ country: district.country.slug, district: district.slug }));
}

export async function getProfileStaticParams(locale: LocaleId): Promise<{ country: string; profile: string }[]> {
  const [countries, profiles] = await Promise.all([safely(getAllCountries), safely(getAllProfiles)]);
  const visibleCountries = new Set(
    countries.filter((country) => isVisible({ ...countryVisibility(country), locale })).map((country) => country.slug),
  );
  return profiles
    .filter(
      (profile) =>
        visibleCountries.has(profile.country.slug) && isVisible({ ...profileVisibility(profile), locale }),
    )
    .map((profile) => ({ country: profile.country.slug, profile: profile.slug }));
}
