import type { Metadata } from "next";
import { ProfileView } from "@/components/catalog/ProfileView";
import { getDictionary } from "@/i18n/dictionaries";
import { pickLocalizedText } from "@/lib/localize";
import { buildPageMetadata } from "@/lib/metadata";
import { profileMetaDescription } from "@/lib/metaDescription";
import { profileSeoTitle } from "@/lib/seo";
import { profilePath } from "@/lib/urls";
import { getProfileStaticParams } from "@/sanity/queries";
import { loadProfilePage } from "@/sanity/pageData";

const LOCALE = "zh-Hant-HK" as const;

export const dynamicParams = true;

export function generateStaticParams() {
  return getProfileStaticParams(LOCALE);
}

type Params = { country: string; profile: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { country: countrySlug, profile: profileSlug } = await params;
  const { profile, country, alternates, socialImageUrl } = await loadProfilePage(countrySlug, profileSlug, LOCALE);
  const dictionary = getDictionary(LOCALE);
  const title = pickLocalizedText(profile.h1Override, LOCALE) || profile.displayName;
  const countryTitle = pickLocalizedText(country.title, LOCALE);
  const districtTitle = pickLocalizedText(profile.district.title, LOCALE);
  return buildPageMetadata({
    title:
      pickLocalizedText(profile.seoTitle, LOCALE) ||
      profileSeoTitle({
        locale: LOCALE,
        siteName: dictionary.common.siteName,
        country: countryTitle,
        district: districtTitle,
        profile: title,
      }),
    description: profileMetaDescription(profile, LOCALE),
    path: profilePath(countrySlug, profile.slug, LOCALE),
    locale: LOCALE,
    alternates,
    socialImageUrl,
    socialImageAlt: profile.displayName,
    siteName: dictionary.common.siteName,
    noIndex: profile.seoNoIndex,
  });
}

export default async function ProfilePage({ params }: { params: Promise<Params> }) {
  const { country: countrySlug, profile: profileSlug } = await params;
  const dictionary = getDictionary(LOCALE);
  const { profile, country, similar, contact, alternates } = await loadProfilePage(countrySlug, profileSlug, LOCALE);
  return (
    <ProfileView
      locale={LOCALE}
      dictionary={dictionary}
      country={country}
      profile={profile}
      similar={similar}
      contact={contact}
      alternateHref={alternates.find((alt) => alt.locale === "en")?.path}
    />
  );
}
