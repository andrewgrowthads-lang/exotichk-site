import type { Metadata } from "next";
import { CountryView } from "@/components/catalog/CountryView";
import { getDictionary } from "@/i18n/dictionaries";
import { pickLocalizedText } from "@/lib/localize";
import { buildPageMetadata } from "@/lib/metadata";
import { countrySeoTitle } from "@/lib/seo";
import { countryPath } from "@/lib/urls";
import { getCountryStaticParams } from "@/sanity/queries";
import { loadCountryPage } from "@/sanity/pageData";

const LOCALE = "zh-Hant-HK" as const;

export const dynamicParams = true;

export function generateStaticParams() {
  return getCountryStaticParams(LOCALE);
}

type Params = { country: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { country: countrySlug } = await params;
  const { country, alternates, socialImageUrl, indexable } = await loadCountryPage(countrySlug, LOCALE);
  const dictionary = getDictionary(LOCALE);
  const countryTitle = pickLocalizedText(country.title, LOCALE);
  return buildPageMetadata({
    title:
      pickLocalizedText(country.seoTitle, LOCALE) ||
      countrySeoTitle({ locale: LOCALE, siteName: dictionary.common.siteName, country: countryTitle }),
    description: pickLocalizedText(country.seoDescription, LOCALE) || pickLocalizedText(country.intro, LOCALE),
    path: countryPath(country.slug, LOCALE),
    locale: LOCALE,
    alternates,
    socialImageUrl,
    socialImageAlt: countryTitle,
    siteName: dictionary.common.siteName,
    noIndex: !indexable,
  });
}

export default async function CountryPage({ params }: { params: Promise<Params> }) {
  const { country: countrySlug } = await params;
  const dictionary = getDictionary(LOCALE);
  const { country, districts, profiles, alternates } = await loadCountryPage(countrySlug, LOCALE);
  return (
    <CountryView
      locale={LOCALE}
      dictionary={dictionary}
      country={country}
      districts={districts}
      profiles={profiles}
      alternateHref={alternates.find((alt) => alt.locale === "en")?.path}
    />
  );
}
