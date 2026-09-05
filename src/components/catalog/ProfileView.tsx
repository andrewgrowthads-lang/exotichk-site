import type { LocaleId } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { formatHkd } from "@/lib/formatPrice";
import { localizeAttribute, localizeLanguage, localizeNationality, pickLocalizedText } from "@/lib/localize";
import { absoluteUrl, countryPath, districtPath, homePath, profilePath } from "@/lib/urls";
import { hasDirectContact } from "@/lib/contact";
import type { ProfileContext } from "@/lib/analytics";
import { ProfileViewTracker } from "@/components/analytics/ProfileViewTracker";
import { ProfileGallery } from "@/components/catalog/ProfileGallery";
import { ProfileGrid } from "@/components/catalog/ProfileGrid";
import { ContactButtons } from "@/components/contact/ContactButtons";
import { CatalogFrame } from "@/components/layout/CatalogFrame";
import { PageShell } from "@/components/layout/PageShell";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/JsonLd";
import type { ContactLinks, CountryDetail, ProfileDetail, ProfileSummary } from "@/types/content";
import Link from "next/link";

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-[var(--line)] py-2.5 text-[14px]">
      <span className="text-[var(--muted)]">{label}</span>
      <span className="text-white">{value}</span>
    </div>
  );
}

export function ProfileView({
  locale,
  dictionary,
  country,
  profile,
  similar,
  contact,
  alternateHref,
}: {
  locale: LocaleId;
  dictionary: Dictionary;
  country: CountryDetail;
  profile: ProfileDetail;
  similar: ProfileSummary[];
  contact: ContactLinks;
  alternateHref?: string;
}) {
  const photos = profile.images ?? [];
  const countryTitle = pickLocalizedText(country.title, locale);
  const districtTitle = pickLocalizedText(profile.district.title, locale);
  const h1 = pickLocalizedText(profile.h1Override, locale) || profile.displayName;
  const listHref = districtPath(country.slug, profile.district.slug, locale);
  const breadcrumbs = [
    { label: dictionary.common.home, href: homePath(locale) },
    { label: countryTitle, href: countryPath(country.slug, locale) },
    { label: districtTitle, href: listHref },
    { label: profile.displayName, href: profilePath(country.slug, profile.slug, locale) },
  ];
  const languages = (profile.languages ?? []).map((value) => localizeLanguage(value, locale));
  const attributes = (profile.attributes ?? []).map((value) => localizeAttribute(value, locale));
  const price = formatHkd(profile.price);
  // No WhatsApp and no Telegram means the sticky bar would render as an
  // empty strip pinned across the bottom of the screen, with `pb-24`
  // reserving room for it. Both are therefore conditional on the same flag.
  const showStickyContact = hasDirectContact(contact);
  const analyticsContext: ProfileContext = {
    profileId: profile._id,
    profile: profile.slug,
    profileName: profile.displayName,
    country: country.slug,
    district: profile.district.slug,
    locale,
  };

  return (
    <PageShell locale={locale} dictionary={dictionary} alternateHref={alternateHref} footer={similar.length === 0} activeCountrySlug={country.slug}>
      <ProfileViewTracker {...analyticsContext} />
      <JsonLd
        data={breadcrumbJsonLd(breadcrumbs.map((item) => ({ name: item.label, url: absoluteUrl(item.href) })))}
      />
      <CatalogFrame className="pt-4 pb-10 sm:pt-5">
      <div className={showStickyContact ? "pb-24 md:pb-0" : undefined}>
      <Link
        href={listHref}
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-[var(--accent-soft)] hover:text-white"
      >
        <span aria-hidden="true">←</span>
        {dictionary.profile.backToList}
      </Link>

      <div className="md:grid md:grid-cols-2 md:items-start md:gap-10 lg:gap-14">
        <ProfileGallery photos={photos} locale={locale} displayName={profile.displayName} dictionary={dictionary} />

        <div className="mt-5 md:mt-0">
          <h1 className="text-[32px] leading-none font-semibold tracking-tight text-white sm:text-[40px]">{h1}</h1>
          <p className="mt-3 text-[14px] text-[var(--muted)]">
            <Link href={countryPath(country.slug, locale)} className="text-[var(--accent-soft)] underline-offset-2 hover:underline">
              {countryTitle}
            </Link>
            <span aria-hidden="true"> · </span>
            <Link
              href={districtPath(country.slug, profile.district.slug, locale)}
              className="text-[var(--accent-soft)] underline-offset-2 hover:underline"
            >
              {districtTitle}
            </Link>
          </p>
          {profile.status === "temporarilyUnavailable" && (
            <div className="mt-3 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-[13px] text-[var(--muted)]">
              <p className="font-medium text-[var(--foreground)]">{dictionary.profile.unavailableBadge}</p>
              <p className="mt-0.5">
                {pickLocalizedText(profile.unavailableMessage, locale) || dictionary.profile.contactAnyway}
              </p>
            </div>
          )}

          {(profile.age || profile.height || profile.nationality || price) && (
            <div className="mt-5">
              {profile.age ? <Fact label={dictionary.profile.age} value={String(profile.age)} /> : null}
              {profile.height ? <Fact label={dictionary.profile.height} value={`${profile.height} cm`} /> : null}
              {profile.nationality ? (
                <Fact label={dictionary.profile.nationality} value={localizeNationality(profile.nationality, locale)} />
              ) : null}
              {price ? <Fact label={dictionary.profile.price} value={price} /> : null}
            </div>
          )}

          {languages.length > 0 && (
            <p className="mt-3 text-[13px] text-[var(--muted)]">
              {dictionary.profile.speaks} {languages.join(", ")}
            </p>
          )}
          {attributes.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {attributes.map((value) => (
                <span
                  key={value}
                  className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1 text-[11px] text-[var(--muted)]"
                >
                  {value}
                </span>
              ))}
            </div>
          )}

          <div className="mt-6">
            <ContactButtons
              contact={contact}
              context={analyticsContext}
              labels={dictionary.contact}
              layout="stack"
              showChannel
            />
          </div>

          <p className="mt-6 text-[15px] leading-relaxed text-[var(--foreground)]">
            {pickLocalizedText(profile.summary, locale)}
          </p>
          {profile.body && (
            <p className="mt-3 text-[15px] leading-relaxed text-[var(--muted)]">{pickLocalizedText(profile.body, locale)}</p>
          )}
        </div>
      </div>

      {similar.length > 0 && (
        <section className="mt-12 md:mb-8">
          <h2 className="mb-4 text-[16px] font-medium text-white">{dictionary.profile.similar}</h2>
          <ProfileGrid profiles={similar} locale={locale} dictionary={dictionary} />
        </section>
      )}
      </div>
      </CatalogFrame>

      {showStickyContact && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--accent)]/25 bg-[var(--background)]/92 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md md:hidden">
          <ContactButtons
            contact={contact}
            context={analyticsContext}
            labels={dictionary.contact}
            layout="bar"
          />
        </div>
      )}
    </PageShell>
  );
}
