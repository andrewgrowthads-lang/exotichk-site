import type { LocaleId } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { pickLocalizedText } from "@/lib/localize";
import { DistrictChips } from "@/components/catalog/DistrictChips";
import { ProfileGrid } from "@/components/catalog/ProfileGrid";
import { JsonLd, organizationJsonLd, websiteJsonLd } from "@/components/seo/JsonLd";
import { absoluteUrl, countryPath, homePath } from "@/lib/urls";
import { PageShell } from "@/components/layout/PageShell";
import type { CountryDetail, DistrictDetail, ProfileSummary } from "@/types/content";
import Link from "next/link";

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
  const countryTitle = pickLocalizedText(country.title, locale);
  const featuredProfiles = profiles.filter((profile) => profile.featured);
  const siteName = agencyName || dictionary.common.siteName;

  return (
    <PageShell locale={locale} dictionary={dictionary} alternateHref={alternateHref}>
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
      <h1 className="text-[24px] font-medium tracking-tight">{dictionary.home.heading}</h1>
      <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-[var(--muted)]">{dictionary.home.intro}</p>
      <h2 className="mt-6 mb-2 text-[16px] font-medium">{countryTitle}</h2>
      <DistrictChips
        countrySlug={country.slug}
        districts={districts}
        locale={locale}
        dictionary={dictionary}
        allHref={countryPath(country.slug, locale)}
      />
      <Link
        href={countryPath(country.slug, locale)}
        className="mt-3 inline-block text-[13px] font-medium underline-offset-2 hover:underline"
      >
        {dictionary.home.viewCountry}
      </Link>
      {featuredProfiles.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-[16px] font-medium">{dictionary.home.featured}</h2>
          <ProfileGrid profiles={featuredProfiles} locale={locale} dictionary={dictionary} priorityFirst />
        </section>
      )}
    </PageShell>
  );
}
