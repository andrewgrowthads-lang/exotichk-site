import type { Metadata } from "next";
import { DistrictView } from "@/components/catalog/DistrictView";
import { getDictionary } from "@/i18n/dictionaries";
import { pickLocalizedText } from "@/lib/localize";
import { buildPageMetadata } from "@/lib/metadata";
import { districtSeoTitle } from "@/lib/seo";
import { districtPath } from "@/lib/urls";
import { getDistrictStaticParams } from "@/sanity/queries";
import { loadDistrictPage } from "@/sanity/pageData";

const LOCALE = "zh-Hant-HK" as const;

export const dynamicParams = true;

export function generateStaticParams() {
  return getDistrictStaticParams(LOCALE);
}

type Params = { country: string; district: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { country: countrySlug, district: districtSlug } = await params;
  const { country, district, alternates, socialImageUrl, indexable } = await loadDistrictPage(
    countrySlug,
    districtSlug,
    LOCALE,
  );
  const dictionary = getDictionary(LOCALE);
  const countryTitle = pickLocalizedText(country.title, LOCALE);
  const districtTitle = pickLocalizedText(district.title, LOCALE);
  return buildPageMetadata({
    title:
      pickLocalizedText(district.seoTitle, LOCALE) ||
      districtSeoTitle({
        locale: LOCALE,
        siteName: dictionary.common.siteName,
        country: countryTitle,
        district: districtTitle,
      }),
    description: pickLocalizedText(district.seoDescription, LOCALE) || pickLocalizedText(district.intro, LOCALE),
    path: districtPath(countrySlug, district.slug, LOCALE),
    locale: LOCALE,
    alternates,
    socialImageUrl,
    socialImageAlt: districtTitle,
    siteName: dictionary.common.siteName,
    noIndex: !indexable,
  });
}

export default async function DistrictPage({ params }: { params: Promise<Params> }) {
  const { country: countrySlug, district: districtSlug } = await params;
  const dictionary = getDictionary(LOCALE);
  const { country, district, districts, profiles, alternates } = await loadDistrictPage(
    countrySlug,
    districtSlug,
    LOCALE,
  );
  return (
    <DistrictView
      locale={LOCALE}
      dictionary={dictionary}
      country={country}
      district={district}
      districts={districts}
      profiles={profiles}
      alternateHref={alternates.find((alt) => alt.locale === "en")?.path}
    />
  );
}
