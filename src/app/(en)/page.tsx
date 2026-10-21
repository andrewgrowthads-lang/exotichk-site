import type { Metadata } from "next";
import { CountrySelectorView } from "@/components/catalog/CountrySelectorView";
import { getDictionary } from "@/i18n/dictionaries";
import { buildPageMetadata } from "@/lib/metadata";
import { homeSeoDescription, homeSeoTitle } from "@/lib/seo";
import { homePath } from "@/lib/urls";
import { loadCountrySelector } from "@/sanity/pageData";

const LOCALE = "en" as const;

export async function generateMetadata(): Promise<Metadata> {
  const { countries, alternates, socialImageUrl, agencyName, defaultSeoTitle, defaultSeoDescription } =
    await loadCountrySelector(LOCALE);
  const dictionary = getDictionary(LOCALE);
  const siteName = agencyName || dictionary.common.siteName;
  const titles = countries.filter((country) => country.translated).map((country) => country.title);
  return buildPageMetadata({
    title: defaultSeoTitle || homeSeoTitle({ locale: LOCALE, siteName, countries: titles }),
    description: defaultSeoDescription || homeSeoDescription(LOCALE, titles),
    path: homePath(LOCALE),
    locale: LOCALE,
    alternates,
    socialImageUrl,
    socialImageAlt: siteName,
    siteName,
  });
}

export default async function HomePage() {
  const dictionary = getDictionary(LOCALE);
  const { countries, alternates, logoUrl, agencyName, agencyDescription } = await loadCountrySelector(LOCALE);
  return (
    <CountrySelectorView
      locale={LOCALE}
      dictionary={dictionary}
      countries={countries}
      alternateHref={alternates.find((alt) => alt.locale === "zh-Hant-HK")?.path}
      logoUrl={logoUrl}
      agencyName={agencyName}
      agencyDescription={agencyDescription}
    />
  );
}
