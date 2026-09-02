import { sanityClient } from "@/sanity/client";
import { statusFilter } from "@/lib/visibility";
import type {
  CountryDetail,
  CountrySummary,
  DistrictDetail,
  DistrictSummary,
  ProfileDetail,
  ProfileSummary,
  SiteSettings,
} from "@/types/content";

/**
 * Every catalog read shares one revalidation tag. At 50-100 documents
 * there is no benefit to per-document tags — they only add bookkeeping
 * and a real gap: a profile moved between districts still needs *both*
 * the old and new listings invalidated, and the webhook payload has no
 * memory of the old district. One shared tag sidesteps that entirely.
 */
const CATALOG_TAG = "catalog";
const REVALIDATE_SECONDS = 60 * 60;

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

const countryProjection = `{
  "_id": _id,
  "slug": slug.current,
  status,
  title ${localizedTextProjection},
  intro ${localizedTextProjection},
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
  "images": coalesce(images, [])[] ${imageProjection},
  sortOrder,
  "updatedAt": _updatedAt,
  "country": country->{ "slug": slug.current },
  "district": district->{ "slug": slug.current, title ${localizedTextProjection} },
}`;

const profileDetailProjection = `{
  ...${profileSummaryProjection},
  body ${localizedTextProjection},
  attributes,
  seoTitle ${localizedTextProjection},
  seoDescription ${localizedTextProjection},
  unavailableMessage ${localizedTextProjection},
  publishedAt,
  "contact": { "telegramUrl": telegramUrl, "whatsappUrl": whatsappUrl, "telegramChannelUrl": telegramChannelUrl },
}`;

export async function getSiteSettings(): Promise<SiteSettings | null> {
  return fetchQuery<SiteSettings | null>(
    `*[_type == "siteSettings"][0]{
      agencyName,
      agencyDescription ${localizedTextProjection},
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
  return fetchQuery<DistrictDetail | null>(
    `*[_type == "district" && slug.current == $districtSlug && country->slug.current == $countrySlug && ${statusFilter(
      "district",
    )}][0] ${districtProjection}`,
    { countrySlug, districtSlug },
  );
}

export async function getProfilesForCountry(countrySlug: string): Promise<ProfileSummary[]> {
  return fetchQuery<ProfileSummary[]>(
    `*[_type == "profile" && country->slug.current == $countrySlug && ${statusFilter(
      "profile",
    )}] | order(sortOrder asc) ${profileSummaryProjection}`,
    { countrySlug },
  );
}

export async function getProfilesForDistrict(
  countrySlug: string,
  districtSlug: string,
): Promise<ProfileSummary[]> {
  return fetchQuery<ProfileSummary[]>(
    `*[_type == "profile" && country->slug.current == $countrySlug && district->slug.current == $districtSlug && ${statusFilter(
      "profile",
    )}] | order(sortOrder asc) ${profileSummaryProjection}`,
    { countrySlug, districtSlug },
  );
}

export async function getProfileBySlug(
  countrySlug: string,
  profileSlug: string,
): Promise<ProfileDetail | null> {
  return fetchQuery<ProfileDetail | null>(
    `*[_type == "profile" && slug.current == $profileSlug && country->slug.current == $countrySlug && ${statusFilter(
      "profile",
    )}][0] ${profileDetailProjection}`,
    { countrySlug, profileSlug },
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

export async function getAllProfiles(): Promise<ProfileSummary[]> {
  return fetchQuery<ProfileSummary[]>(
    `*[_type == "profile" && ${statusFilter("profile")}] | order(sortOrder asc) ${profileSummaryProjection}`,
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

export async function getCountryStaticParams(): Promise<{ country: string }[]> {
  const countries = await safely(getAllCountries);
  return countries.map((country) => ({ country: country.slug }));
}

export async function getDistrictStaticParams(): Promise<{ country: string; district: string }[]> {
  const districts = await safely(getAllDistricts);
  return districts.map((district) => ({ country: district.country.slug, district: district.slug }));
}

export async function getProfileStaticParams(): Promise<{ country: string; profile: string }[]> {
  const profiles = await safely(getAllProfiles);
  return profiles.map((item) => ({ country: item.country.slug, profile: item.slug }));
}
