import type { Metadata } from "next";
import { getDictionary } from "@/i18n/dictionaries";
import { buildPageMetadata } from "@/lib/metadata";
import { absoluteUrl, homePath } from "@/lib/urls";
import { PageShell } from "@/components/layout/PageShell";
import { CountryCard } from "@/components/catalog/CountryCard";
import { JsonLd, organizationJsonLd } from "@/components/seo/JsonLd";
import { getCountries } from "@/sanity/queries";

const LOCALE = "en" as const;

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: "ExoticHK — verified companion directory",
    description: "Browse companion profiles by destination and district. Contact managers directly on Telegram or WhatsApp.",
    path: homePath(LOCALE),
    locale: LOCALE,
    alternates: [
      { locale: "en", path: homePath("en") },
      { locale: "zh-Hant-HK", path: homePath("zh-Hant-HK") },
    ],
  });
}

export default async function HomePage() {
  const dictionary = getDictionary(LOCALE);
  const countries = await getCountries();

  return (
    <PageShell locale={LOCALE} dictionary={dictionary} alternateHref={homePath("zh-Hant-HK")}>
      <JsonLd data={organizationJsonLd({ name: dictionary.common.siteName, url: absoluteUrl(homePath(LOCALE)) })} />
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">{dictionary.common.countries}</h1>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {countries.map((country) => (
          <CountryCard key={country._id} country={country} locale={LOCALE} />
        ))}
      </div>
    </PageShell>
  );
}
