import type { LocaleId } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { districtExpandedLabel } from "@/lib/districtLabels";
import { pickLocalizedText } from "@/lib/localize";
import { CatalogHero } from "@/components/catalog/CatalogHero";
import { DistrictChips } from "@/components/catalog/DistrictChips";
import { ProfileGrid } from "@/components/catalog/ProfileGrid";
import { PageShell } from "@/components/layout/PageShell";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/JsonLd";
import { absoluteUrl, countryPath, districtPath, homePath } from "@/lib/urls";
import type { CountryDetail, DistrictDetail, ProfileSummary } from "@/types/content";

export function DistrictView({
  locale,
  dictionary,
  country,
  district,
  districts,
  profiles,
  alternateHref,
}: {
  locale: LocaleId;
  dictionary: Dictionary;
  country: CountryDetail;
  district: DistrictDetail;
  districts: DistrictDetail[];
  profiles: ProfileSummary[];
  alternateHref?: string;
}) {
  const countryTitle = pickLocalizedText(country.title, locale);
  const districtTitle = pickLocalizedText(district.title, locale);
  const districtLine = districtExpandedLabel(district.slug, districtTitle);
  const breadcrumbs = [
    { label: dictionary.common.home, href: homePath(locale) },
    { label: countryTitle, href: countryPath(country.slug, locale) },
    { label: districtTitle, href: districtPath(country.slug, district.slug, locale) },
  ];

  return (
    <PageShell locale={locale} dictionary={dictionary} alternateHref={alternateHref} activeCountrySlug={country.slug} atmosphereImage={country.image}>
      <JsonLd
        data={breadcrumbJsonLd(breadcrumbs.map((item) => ({ name: item.label, url: absoluteUrl(item.href) })))}
      />
      <CatalogHero
        locationTitle={countryTitle}
        contextLine={districtLine}
        locale={locale}
        locationAs="p"
        contextAs="h1"
        showFlag={country.slug === "hong-kong"}
      >
        <DistrictChips
          countrySlug={country.slug}
          districts={districts}
          locale={locale}
          dictionary={dictionary}
          active={district.slug}
          allHref={countryPath(country.slug, locale)}
        />
        <div className="mt-3 sm:mt-3.5">
          <ProfileGrid profiles={profiles} locale={locale} dictionary={dictionary} hideDistrict priorityFirst />
        </div>
        <p className="mt-10 max-w-2xl text-[13px] leading-relaxed text-[var(--muted)] [text-shadow:0_1px_14px_rgba(0,0,0,0.85)]">
          {pickLocalizedText(district.intro, locale)}
        </p>
        {pickLocalizedText(district.body, locale) && (
          <p className="mt-3 max-w-2xl text-[13px] leading-relaxed text-[var(--muted)] [text-shadow:0_1px_14px_rgba(0,0,0,0.85)]">
            {pickLocalizedText(district.body, locale)}
          </p>
        )}
      </CatalogHero>
    </PageShell>
  );
}
