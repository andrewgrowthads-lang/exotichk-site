import type { Metadata } from "next";
import { getDictionary } from "@/i18n/dictionaries";
import { pickLocalizedText } from "@/lib/localize";
import { buildPageMetadata } from "@/lib/metadata";
import { countryPath, districtPath, homePath } from "@/lib/urls";
import { PageShell } from "@/components/layout/PageShell";
import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { ProfileCard } from "@/components/catalog/ProfileCard";
import { getCountryBySlug, getDistrictStaticParams } from "@/sanity/queries";
import { loadDistrictPage } from "@/sanity/pageData";

const LOCALE = "en" as const;

export const dynamicParams = true;

export async function generateStaticParams() {
  return getDistrictStaticParams();
}

type Params = { country: string; district: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { country: countrySlug, district: districtSlug } = await params;
  const { district, alternates } = await loadDistrictPage(countrySlug, districtSlug, LOCALE);
  return buildPageMetadata({
    title: pickLocalizedText(district.seoTitle, LOCALE) || pickLocalizedText(district.title, LOCALE),
    description: pickLocalizedText(district.seoDescription, LOCALE) || pickLocalizedText(district.intro, LOCALE),
    path: districtPath(countrySlug, district.slug, LOCALE),
    locale: LOCALE,
    alternates,
  });
}

export default async function DistrictPage({ params }: { params: Promise<Params> }) {
  const { country: countrySlug, district: districtSlug } = await params;
  const dictionary = getDictionary(LOCALE);
  const [{ district, profiles, alternates }, country] = await Promise.all([
    loadDistrictPage(countrySlug, districtSlug, LOCALE),
    getCountryBySlug(countrySlug),
  ]);
  const alternate = alternates.find((alt) => alt.locale === "zh-Hant-HK");

  const title = pickLocalizedText(district.title, LOCALE);
  const countryTitle = country ? pickLocalizedText(country.title, LOCALE) : countrySlug;

  return (
    <PageShell locale={LOCALE} dictionary={dictionary} alternateHref={alternate?.path}>
      <Breadcrumbs
        items={[
          { label: dictionary.common.breadcrumbHome, href: homePath(LOCALE) },
          { label: countryTitle, href: countryPath(countrySlug, LOCALE) },
          { label: title, href: districtPath(countrySlug, district.slug, LOCALE) },
        ]}
      />
      <h1 className="mt-3 text-2xl font-semibold text-neutral-900 dark:text-neutral-50">{title}</h1>
      <p className="mt-2 max-w-2xl text-neutral-600 dark:text-neutral-400">{pickLocalizedText(district.intro, LOCALE)}</p>

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
