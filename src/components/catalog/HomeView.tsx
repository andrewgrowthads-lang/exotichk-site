import type { LocaleId } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { pickLocalizedText } from "@/lib/localize";
import { CatalogHero } from "@/components/catalog/CatalogHero";
import { DistrictChips } from "@/components/catalog/DistrictChips";
import { ProfileGrid } from "@/components/catalog/ProfileGrid";
import { JsonLd, organizationJsonLd, websiteJsonLd } from "@/components/seo/JsonLd";
import { absoluteUrl, homePath } from "@/lib/urls";
import { PageShell } from "@/components/layout/PageShell";
import type { CountryDetail, DistrictDetail, ProfileSummary } from "@/types/content";

export function HomeView({
  locale,
  dictionary,
  country,
  districts,
  profiles,
  alternateHref,
  logoUrl,
  agencyName,
  agencyDescription,
}: {
  locale: LocaleId;
  dictionary: Dictionary;
  country: CountryDetail;
  districts: DistrictDetail[];
  profiles: ProfileSummary[];
  alternateHref?: string;
  logoUrl?: string;
  agencyName?: string;
  agencyDescription?: string;
}) {
  const siteName = agencyName || dictionary.common.siteName;
  const countryTitle = pickLocalizedText(country.title, locale);

  return (
    <PageShell
      locale={locale}
      dictionary={dictionary}
      alternateHref={alternateHref}
      activeCountrySlug={country.slug}
    >
      <JsonLd
        data={organizationJsonLd({
          name: siteName,
          url: absoluteUrl(homePath("en")),
          logoUrl,
          description: agencyDescription,
        })}
      />
      <JsonLd
        data={websiteJsonLd({
          name: siteName,
          url: absoluteUrl(homePath(locale)),
          language: locale,
        })}
      />
      <h1 className="sr-only">{siteName}</h1>
      <CatalogHero
        title={countryTitle}
        subtitle={dictionary.common.tagline}
        image={country.image}
        locale={locale}
        titleAs="p"
      />
      <div className="mt-4">
        <DistrictChips
          countrySlug={country.slug}
          districts={districts}
          locale={locale}
          dictionary={dictionary}
          allHref={homePath(locale)}
        />
      </div>
      <div className="mt-4">
        <ProfileGrid profiles={profiles} locale={locale} dictionary={dictionary} priorityFirst />
      </div>
      {pickLocalizedText(country.intro, locale) && (
        <p className="mt-10 max-w-xl text-[13px] leading-relaxed text-[var(--muted)]">
          {pickLocalizedText(country.intro, locale)}
        </p>
      )}
      {pickLocalizedText(country.body, locale) && (
        <p className="mt-3 max-w-xl text-[13px] leading-relaxed text-[var(--muted)]">
          {pickLocalizedText(country.body, locale)}
        </p>
      )}
    </PageShell>
  );
}
