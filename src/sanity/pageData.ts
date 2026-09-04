import { notFound } from "next/navigation";
import type { LocaleId } from "@/i18n/config";
import type { AlternatePath } from "@/lib/metadata";
import { countryPath, districtPath, homePath, profilePath } from "@/lib/urls";
import { pickLocalizedText } from "@/lib/localize";
import {
  countryVisibility,
  districtVisibility,
  isListingIndexable,
  isVisible,
  profileVisibility,
  visibleLocalesFor,
} from "@/lib/visibility";
import {
  getCountries,
  getCountryBySlug,
  getDistrictBySlug,
  getDistrictsForCountry,
  getFeaturedProfilesForCountry,
  getProfileBySlug,
  getProfilesForCountry,
  getProfilesForDistrict,
  getSimilarProfiles,
  getSiteSettings,
} from "@/sanity/queries";
import { plainImageUrl, socialImageUrl } from "@/sanity/image";
import { buildWhatsAppUrl, resolveContact } from "@/lib/contact";
import type {
  ContactLinks,
  CountryDetail,
  DistrictDetail,
  DistrictSummary,
  ProfileDetail,
  ProfileSummary,
} from "@/types/content";

/** Drops listing items that would 404 in this locale — a listing must never link to a page it cannot render. */
function onlyVisibleDistricts(districts: DistrictSummary[], locale: LocaleId): DistrictSummary[] {
  return districts.filter((district) => isVisible({ ...districtVisibility(district), locale }));
}

function onlyVisibleProfiles(profiles: ProfileSummary[], locale: LocaleId): ProfileSummary[] {
  return profiles.filter((profile) => isVisible({ ...profileVisibility(profile), locale }));
}

export interface HomePageData {
  country: CountryDetail;
  districts: DistrictDetail[];
  profiles: ProfileSummary[];
  alternates: AlternatePath[];
  socialImageUrl?: string;
  logoUrl?: string;
  agencyName?: string;
  agencyDescription?: string;
  defaultSeoTitle?: string;
  defaultSeoDescription?: string;
}

/**
 * The English landing page shows the single supported country's
 * listing (Hong Kong today). If more countries are added, the landing
 * page becomes a country picker instead — not needed yet at this scale.
 *
 * Visibility is entirely delegated to `loadCountryPage`: the home page
 * *is* that country's page, just at a different URL, so it must 404 for
 * a locale under the exact same conditions.
 */
export async function loadHomePage(locale: LocaleId): Promise<HomePageData> {
  const [countries, settings] = await Promise.all([getCountries(), getSiteSettings()]);
  const country = countries[0];
  if (!country) notFound();
  const page = await loadCountryPage(country.slug, locale, { featuredOnly: true });
  return {
    ...page,
    alternates: page.alternates.map((alt) => ({ locale: alt.locale, path: homePath(alt.locale) })),
    logoUrl: plainImageUrl(settings?.logo, 512),
    agencyName: settings?.agencyName,
    agencyDescription: pickLocalizedText(settings?.agencyDescription, locale) || undefined,
    defaultSeoTitle: pickLocalizedText(settings?.defaultSeoTitle, locale) || undefined,
    defaultSeoDescription: pickLocalizedText(settings?.defaultSeoDescription, locale) || undefined,
  };
}

export interface CountryPageData {
  country: CountryDetail;
  districts: DistrictDetail[];
  profiles: ProfileSummary[];
  alternates: AlternatePath[];
  socialImageUrl?: string;
  /** `false` when the listing renders no profiles — see `isListingIndexable`. */
  indexable: boolean;
}

export async function loadCountryPage(
  countrySlug: string,
  locale: LocaleId,
  options: { featuredOnly?: boolean } = {},
): Promise<CountryPageData> {
  const [country, settings] = await Promise.all([getCountryBySlug(countrySlug), getSiteSettings()]);
  if (!country) notFound();

  const visibleLocales = visibleLocalesFor(countryVisibility(country));
  if (!visibleLocales.includes(locale)) notFound();

  const [districts, profiles] = await Promise.all([
    getDistrictsForCountry(countrySlug),
    options.featuredOnly
      ? getFeaturedProfilesForCountry(countrySlug)
      : getProfilesForCountry(countrySlug),
  ]);
  const visibleProfiles = onlyVisibleProfiles(profiles, locale);
  return {
    country,
    districts: onlyVisibleDistricts(districts, locale),
    profiles: visibleProfiles,
    alternates: localeAlternates((l) => countryPath(country.slug, l), visibleLocales),
    socialImageUrl: socialImageUrl(country.image) ?? socialImageUrl(settings?.defaultSocialImage),
    indexable: isListingIndexable({
      ...countryVisibility(country),
      locale,
      visibleProfileCount: visibleProfiles.length,
    }),
  };
}

export interface DistrictPageData {
  country: CountryDetail;
  district: DistrictDetail;
  districts: DistrictDetail[];
  profiles: ProfileSummary[];
  alternates: AlternatePath[];
  socialImageUrl?: string;
  /** `false` when the listing renders no profiles — see `isListingIndexable`. */
  indexable: boolean;
}

export async function loadDistrictPage(
  countrySlug: string,
  districtSlug: string,
  locale: LocaleId,
): Promise<DistrictPageData> {
  const [country, district, settings] = await Promise.all([
    getCountryBySlug(countrySlug),
    getDistrictBySlug(countrySlug, districtSlug),
    getSiteSettings(),
  ]);
  if (!country || !district) notFound();

  // The district's URL carries the country's slug, so a locale only
  // counts as visible here if *both* the country and the district have
  // it — otherwise the district page would outlive its own breadcrumb.
  const countryLocales = visibleLocalesFor(countryVisibility(country));
  const districtLocales = visibleLocalesFor(districtVisibility(district));
  const visibleLocales = districtLocales.filter((l) => countryLocales.includes(l));
  if (!visibleLocales.includes(locale)) notFound();

  const [districts, profiles] = await Promise.all([
    getDistrictsForCountry(countrySlug),
    getProfilesForDistrict(countrySlug, districtSlug),
  ]);
  const visibleProfiles = onlyVisibleProfiles(profiles, locale);
  return {
    country,
    district,
    districts: onlyVisibleDistricts(districts, locale),
    profiles: visibleProfiles,
    alternates: localeAlternates((l) => districtPath(countrySlug, district.slug, l), visibleLocales),
    socialImageUrl:
      socialImageUrl(district.image) ??
      socialImageUrl(country.image) ??
      socialImageUrl(settings?.defaultSocialImage),
    indexable: isListingIndexable({
      ...districtVisibility(district),
      locale,
      visibleProfileCount: visibleProfiles.length,
    }),
  };
}

export interface ProfilePageData {
  profile: ProfileDetail;
  country: CountryDetail;
  similar: ProfileSummary[];
  contact: ContactLinks;
  alternates: AlternatePath[];
  socialImageUrl?: string;
}

export async function loadProfilePage(
  countrySlug: string,
  profileSlug: string,
  locale: LocaleId,
): Promise<ProfilePageData> {
  const [country, profile, settings] = await Promise.all([
    getCountryBySlug(countrySlug),
    getProfileBySlug(countrySlug, profileSlug),
    getSiteSettings(),
  ]);
  if (!country || !profile) notFound();

  // Same reasoning as districts: the profile's URL carries the country's
  // slug, so both need to be visible in a locale. `displayName` is not
  // translated (shown as-is in both locales), so the only thing that can
  // actually gate a profile's Chinese page is its short description.
  const countryLocales = visibleLocalesFor(countryVisibility(country));
  const profileLocales = visibleLocalesFor(profileVisibility(profile));
  const visibleLocales = profileLocales.filter((l) => countryLocales.includes(l));
  if (!visibleLocales.includes(locale)) notFound();

  const similar = onlyVisibleProfiles(await getSimilarProfiles(countrySlug, profileSlug), locale);
  const contact = resolveContact(profile.contact, settings?.contact);
  return {
    profile,
    country,
    similar,
    contact: {
      ...contact,
      whatsappUrl: contact.whatsappUrl
        ? buildWhatsAppUrl(contact.whatsappUrl, locale, { name: profile.displayName, internalId: profile.internalName })
        : undefined,
    },
    alternates: localeAlternates((l) => profilePath(countrySlug, profile.slug, l), visibleLocales),
    socialImageUrl: socialImageUrl(profile.ogImage) ?? socialImageUrl(profile.images[0]) ?? socialImageUrl(settings?.defaultSocialImage),
  };
}

/** Builds the hreflang/switcher path list — only for locales the caller has already established are visible. */
function localeAlternates(pathFor: (locale: LocaleId) => string, visibleLocales: LocaleId[]): AlternatePath[] {
  return visibleLocales.map((locale) => ({ locale, path: pathFor(locale) }));
}
