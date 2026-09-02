import type { Metadata } from "next";
import { getDictionary } from "@/i18n/dictionaries";
import { pickLocalizedText } from "@/lib/localize";
import { buildPageMetadata } from "@/lib/metadata";
import { countryPath, homePath } from "@/lib/urls";
import { PageShell } from "@/components/layout/PageShell";
import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { DistrictCard } from "@/components/catalog/DistrictCard";
import { ProfileCard } from "@/components/catalog/ProfileCard";
import { getCountryStaticParams } from "@/sanity/queries";
import { loadCountryPage } from "@/sanity/pageData";

const LOCALE = "en" as const;

export const dynamicParams = true;

export async function generateStaticParams() {
  return getCountryStaticParams();
}

type Params = { country: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { country: countrySlug } = await params;
  const { country, alternates } = await loadCountryPage(countrySlug, LOCALE);
  return buildPageMetadata({
    title: pickLocalizedText(country.seoTitle, LOCALE) || pickLocalizedText(country.title, LOCALE),
    description: pickLocalizedText(country.seoDescription, LOCALE) || pickLocalizedText(country.intro, LOCALE),
    path: countryPath(country.slug, LOCALE),
    locale: LOCALE,
    alternates,
  });
}

export default async function CountryPage({ params }: { params: Promise<Params> }) {
  const { country: countrySlug } = await params;
  const dictionary = getDictionary(LOCALE);
  const { country, districts, profiles, alternates } = await loadCountryPage(countrySlug, LOCALE);
  const alternate = alternates.find((alt) => alt.locale === "zh-Hant-HK");

  const title = pickLocalizedText(country.title, LOCALE);

  return (
    <PageShell locale={LOCALE} dictionary={dictionary} alternateHref={alternate?.path}>
      <Breadcrumbs items={[{ label: dictionary.common.breadcrumbHome, href: homePath(LOCALE) }, { label: title, href: countryPath(country.slug, LOCALE) }]} />
      <h1 className="mt-3 text-2xl font-semibold text-neutral-900 dark:text-neutral-50">{title}</h1>
      <p className="mt-2 max-w-2xl text-neutral-600 dark:text-neutral-400">{pickLocalizedText(country.intro, LOCALE)}</p>

      {districts.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">{dictionary.common.districts}</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {districts.map((district) => (
              <DistrictCard key={district._id} district={district} countrySlug={country.slug} locale={LOCALE} />
            ))}
          </div>
        </section>
      )}

      {profiles.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">{dictionary.common.profiles}</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {profiles.map((profile) => (
              <ProfileCard key={profile._id} profile={profile} locale={LOCALE} dictionary={dictionary} />
            ))}
          </div>
        </section>
      )}
    </PageShell>
  );
}
