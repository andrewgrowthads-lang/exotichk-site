import { notFound } from "next/navigation";
import { locales, type LocaleId } from "@/i18n/config";
import type { AlternatePath } from "@/lib/metadata";
import { countryPath, districtPath, profilePath } from "@/lib/urls";
import { isVisible, type ContentType } from "@/lib/visibility";
import {
  getCountryBySlug,
  getDistrictBySlug,
  getDistrictsForCountry,
  getProfileBySlug,
  getProfilesForCountry,
  getProfilesForDistrict,
} from "@/sanity/queries";
import type {
  CountryDetail,
  DistrictDetail,
  DistrictSummary,
  LocalizedText,
  ProfileDetail,
  ProfileSummary,
} from "@/types/content";

/**
 * Data loaders shared by both locale route branches for each page type.
 * Each one applies the single visibility predicate (`lib/visibility.ts`),
 * 404s through `notFound()` when the requested locale is not visible,
 * and computes the hreflang/language-switcher alternate set from the
 * *same* fetched document — no second query needed to know whether the
 * other locale exists.
 */

export interface CountryPageData {
  country: CountryDetail;
  districts: DistrictSummary[];
  profiles: ProfileSummary[];
  alternates: AlternatePath[];
}

export async function loadCountryPage(countrySlug: string, locale: LocaleId): Promise<CountryPageData> {
  const country = await getCountryBySlug(countrySlug);
  if (!country || !isVisible({ type: "country", status: country.status, title: country.title, intro: country.intro, locale })) {
    notFound();
  }

  const alternates = computeAlternates("country", country.status, country.title, country.intro, (loc) =>
    countryPath(country.slug, loc),
  );

  const [districts, profiles] = await Promise.all([
    getDistrictsForCountry(countrySlug),
    getProfilesForCountry(countrySlug),
  ]);

  return { country, districts, profiles, alternates };
}

export interface DistrictPageData {
  country: { slug: string };
  district: DistrictDetail;
  profiles: ProfileSummary[];
  alternates: AlternatePath[];
}

export async function loadDistrictPage(
  countrySlug: string,
  districtSlug: string,
  locale: LocaleId,
): Promise<DistrictPageData> {
  const district = await getDistrictBySlug(countrySlug, districtSlug);
  if (
    !district ||
    !isVisible({ type: "district", status: district.status, title: district.title, intro: district.intro, locale })
  ) {
    notFound();
  }

  const alternates = computeAlternates("district", district.status, district.title, district.intro, (loc) =>
    districtPath(countrySlug, district.slug, loc),
  );
  const profiles = await getProfilesForDistrict(countrySlug, districtSlug);

  return { country: { slug: countrySlug }, district, profiles, alternates };
}

export interface ProfilePageData {
  profile: ProfileDetail;
  alternates: AlternatePath[];
}

export async function loadProfilePage(
  countrySlug: string,
  profileSlug: string,
  locale: LocaleId,
): Promise<ProfilePageData> {
  const profile = await getProfileBySlug(countrySlug, profileSlug);
  if (
    !profile ||
    !isVisible({
      type: "profile",
      status: profile.status,
      title: profileTitle(profile.displayName),
      intro: profile.summary,
      locale,
    })
  ) {
    notFound();
  }

  const alternates = computeAlternates(
    "profile",
    profile.status,
    profileTitle(profile.displayName),
    profile.summary,
    (loc) => profilePath(countrySlug, profile.slug, loc),
  );

  return { profile, alternates };
}

/** Display names are language-neutral; they must not gate Chinese visibility. */
function profileTitle(displayName: string): LocalizedText {
  return { en: displayName, zhHantHK: displayName };
}

function computeAlternates(
  type: ContentType,
  status: string,
  title: LocalizedText,
  intro: LocalizedText,
  pathFor: (locale: LocaleId) => string,
): AlternatePath[] {
  return locales
    .filter((locale) => isVisible({ type, status, title, intro, locale: locale.id }))
    .map((locale) => ({ locale: locale.id, path: pathFor(locale.id) }));
}
