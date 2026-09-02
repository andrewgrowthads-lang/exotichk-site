import type { Metadata } from "next";
import { getDictionary } from "@/i18n/dictionaries";
import { resolveContact } from "@/lib/contact";
import { pickLocalizedText } from "@/lib/localize";
import { buildPageMetadata } from "@/lib/metadata";
import { absoluteUrl, countryPath, districtPath, homePath, profilePath } from "@/lib/urls";
import { PageShell } from "@/components/layout/PageShell";
import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { ContactButtons } from "@/components/contact/ContactButtons";
import { SanityImg } from "@/components/media/SanityImg";
import { breadcrumbJsonLd, JsonLd } from "@/components/seo/JsonLd";
import { getCountryBySlug, getProfileStaticParams, getSiteSettings } from "@/sanity/queries";
import { loadProfilePage } from "@/sanity/pageData";

const LOCALE = "en" as const;

export const dynamicParams = true;

export async function generateStaticParams() {
  return getProfileStaticParams();
}

type Params = { country: string; profile: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { country: countrySlug, profile: profileSlug } = await params;
  const { profile, alternates } = await loadProfilePage(countrySlug, profileSlug, LOCALE);
  return buildPageMetadata({
    title: pickLocalizedText(profile.seoTitle, LOCALE) || profile.displayName,
    description: pickLocalizedText(profile.seoDescription, LOCALE) || pickLocalizedText(profile.summary, LOCALE),
    path: profilePath(countrySlug, profile.slug, LOCALE),
    locale: LOCALE,
    alternates,
  });
}

export default async function ProfilePage({ params }: { params: Promise<Params> }) {
  const { country: countrySlug, profile: profileSlug } = await params;
  const dictionary = getDictionary(LOCALE);
  const [{ profile, alternates }, country, siteSettings] = await Promise.all([
    loadProfilePage(countrySlug, profileSlug, LOCALE),
    getCountryBySlug(countrySlug),
    getSiteSettings(),
  ]);
  const alternate = alternates.find((alt) => alt.locale === "zh-Hant-HK");

  const countryTitle = country ? pickLocalizedText(country.title, LOCALE) : countrySlug;
  const districtTitle = pickLocalizedText(profile.district.title, LOCALE);
  const contact = resolveContact(profile.contact, siteSettings?.contact);

  return (
    <PageShell locale={LOCALE} dictionary={dictionary} alternateHref={alternate?.path}>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: dictionary.common.breadcrumbHome, url: absoluteUrl(homePath(LOCALE)) },
          { name: countryTitle, url: absoluteUrl(countryPath(countrySlug, LOCALE)) },
          { name: districtTitle, url: absoluteUrl(districtPath(countrySlug, profile.district.slug, LOCALE)) },
          { name: profile.displayName, url: absoluteUrl(profilePath(countrySlug, profile.slug, LOCALE)) },
        ])}
      />
      <Breadcrumbs
        items={[
          { label: dictionary.common.breadcrumbHome, href: homePath(LOCALE) },
          { label: countryTitle, href: countryPath(countrySlug, LOCALE) },
          { label: districtTitle, href: districtPath(countrySlug, profile.district.slug, LOCALE) },
          { label: profile.displayName, href: profilePath(countrySlug, profile.slug, LOCALE) },
        ]}
      />

      <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="grid grid-cols-2 gap-2">
          {profile.images.map((image, index) => (
            <div key={index} className={index === 0 ? "col-span-2 aspect-[4/3] overflow-hidden rounded-xl" : "aspect-square overflow-hidden rounded-xl"}>
              <SanityImg
                image={image}
                locale={LOCALE}
                fallbackAlt={profile.displayName}
                priority={index === 0}
                sizes={index === 0 ? "(min-width: 768px) 50vw, 100vw" : "(min-width: 768px) 25vw, 50vw"}
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>

        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">{profile.displayName}</h1>
            {profile.status === "temporarilyUnavailable" && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                {dictionary.profile.unavailableBadge}
              </span>
            )}
          </div>
          <p className="mt-1 text-neutral-500 dark:text-neutral-400">{districtTitle}</p>

          <p className="mt-4 text-neutral-700 dark:text-neutral-300">{pickLocalizedText(profile.summary, LOCALE)}</p>
          {profile.body && <p className="mt-3 text-neutral-700 dark:text-neutral-300">{pickLocalizedText(profile.body, LOCALE)}</p>}

          {profile.status === "temporarilyUnavailable" && profile.unavailableMessage && (
            <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              {pickLocalizedText(profile.unavailableMessage, LOCALE)}
            </p>
          )}

          {profile.attributes && profile.attributes.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2">
              {profile.attributes.map((attribute) => (
                <li key={attribute} className="rounded-full bg-neutral-100 px-3 py-1 text-sm text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                  {attribute}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-6">
            <ContactButtons
              contact={contact}
              profile={profile.slug}
              country={countrySlug}
              district={profile.district.slug}
              locale={LOCALE}
              labels={dictionary.contact}
            />
          </div>
        </div>
      </div>
    </PageShell>
  );
}
