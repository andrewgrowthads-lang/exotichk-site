import type { LocaleId } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { pickLocalizedText } from "@/lib/localize";
import { DistrictChips } from "@/components/catalog/DistrictChips";
import { ProfileGrid } from "@/components/catalog/ProfileGrid";
import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { PageShell } from "@/components/layout/PageShell";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/JsonLd";
import { absoluteUrl, countryPath, homePath } from "@/lib/urls";
import type { CountryDetail, DistrictDetail, ProfileSummary } from "@/types/content";

export function CountryView({
  locale,
  dictionary,
  country,
  districts,
  profiles,
  alternateHref,
}: {
  locale: LocaleId;
  dictionary: Dictionary;
  country: CountryDetail;
  districts: DistrictDetail[];
  profiles: ProfileSummary[];
  alternateHref?: string;
}) {
  const countryTitle = pickLocalizedText(country.title, locale);
  const breadcrumbs = [
    { label: dictionary.common.home, href: homePath(locale) },
    { label: countryTitle, href: countryPath(country.slug, locale) },
  ];

  return (
    <PageShell locale={locale} dictionary={dictionary} alternateHref={alternateHref}>
      <JsonLd
        data={breadcrumbJsonLd(breadcrumbs.map((item) => ({ name: item.label, url: absoluteUrl(item.href) })))}
      />
      <Breadcrumbs items={breadcrumbs} />
      <h1 className="text-[20px] font-medium tracking-tight">{countryTitle}</h1>
      <div className="mt-2">
        <DistrictChips
          countrySlug={country.slug}
          districts={districts}
          locale={locale}
          dictionary={dictionary}
          allHref={countryPath(country.slug, locale)}
        />
      </div>
      <div className="mt-3">
        <ProfileGrid profiles={profiles} locale={locale} dictionary={dictionary} priorityFirst />
      </div>
      <p className="mt-10 max-w-xl text-[13px] leading-relaxed text-[var(--muted)]">
        {pickLocalizedText(country.intro, locale)}
      </p>
      {pickLocalizedText(country.body, locale) && (
        <p className="mt-3 max-w-xl text-[13px] leading-relaxed text-[var(--muted)]">
          {pickLocalizedText(country.body, locale)}
        </p>
      )}
    </PageShell>
  );
}
