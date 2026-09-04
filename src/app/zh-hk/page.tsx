import type { Metadata } from "next";
import { HomeView } from "@/components/catalog/HomeView";
import { getDictionary } from "@/i18n/dictionaries";
import { pickLocalizedText } from "@/lib/localize";
import { buildPageMetadata } from "@/lib/metadata";
import { homeSeoDescription, homeSeoTitle } from "@/lib/seo";
import { homePath } from "@/lib/urls";
import { loadHomePage } from "@/sanity/pageData";

const LOCALE = "zh-Hant-HK" as const;

export async function generateMetadata(): Promise<Metadata> {
  const { country, alternates, socialImageUrl, agencyName, defaultSeoTitle, defaultSeoDescription } =
    await loadHomePage(LOCALE);
  const dictionary = getDictionary(LOCALE);
  const countryTitle = pickLocalizedText(country.title, LOCALE);
  return buildPageMetadata({
    title:
      defaultSeoTitle ||
      homeSeoTitle({ locale: LOCALE, siteName: agencyName || dictionary.common.siteName, country: countryTitle }),
    description: defaultSeoDescription || homeSeoDescription(LOCALE, countryTitle),
    path: homePath(LOCALE),
    locale: LOCALE,
    alternates,
    socialImageUrl,
    socialImageAlt: countryTitle,
    siteName: agencyName || dictionary.common.siteName,
  });
}

export default async function HomePage() {
  const dictionary = getDictionary(LOCALE);
  const { country, districts, profiles, alternates, logoUrl, agencyName, agencyDescription } =
    await loadHomePage(LOCALE);
  return (
    <HomeView
      locale={LOCALE}
      dictionary={dictionary}
      country={country}
      districts={districts}
      profiles={profiles}
      alternateHref={alternates.find((alt) => alt.locale === "en")?.path}
      logoUrl={logoUrl}
      agencyName={agencyName}
      agencyDescription={agencyDescription}
    />
  );
}
