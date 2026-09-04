import type { LocaleId } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { localizeAttribute, localizeLanguage, localizeNationality, pickLocalizedText } from "@/lib/localize";
import { absoluteUrl, countryPath, districtPath, homePath, profilePath } from "@/lib/urls";
import { hasDirectContact } from "@/lib/contact";
import type { ProfileContext } from "@/lib/analytics";
import { ProfileViewTracker } from "@/components/analytics/ProfileViewTracker";
import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { ProfileGallery } from "@/components/catalog/ProfileGallery";
import { ProfileGrid } from "@/components/catalog/ProfileGrid";
import { ContactButtons } from "@/components/contact/ContactButtons";
import { PageShell } from "@/components/layout/PageShell";
import { CatalogPhoto } from "@/components/media/CatalogPhoto";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/JsonLd";
import type { ContactLinks, CountryDetail, ProfileDetail, ProfileSummary } from "@/types/content";
import Link from "next/link";

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
  const rest = photos.slice(1);
  const countryTitle = pickLocalizedText(country.title, locale);
  const districtTitle = pickLocalizedText(profile.district.title, locale);
  const h1 = pickLocalizedText(profile.h1Override, locale) || profile.displayName;
  const breadcrumbs = [
    { label: dictionary.common.home, href: homePath(locale) },
    { label: countryTitle, href: countryPath(country.slug, locale) },
    { label: districtTitle, href: districtPath(country.slug, profile.district.slug, locale) },
    { label: profile.displayName, href: profilePath(country.slug, profile.slug, locale) },
  ];
  const stats = [
    profile.age ? String(profile.age) : null,
    profile.height ? `${profile.height} cm` : null,
    profile.nationality ? localizeNationality(profile.nationality, locale) : null,
  ].filter((value): value is string => Boolean(value));
  const languages = (profile.languages ?? []).map((value) => localizeLanguage(value, locale));
  const attributes = (profile.attributes ?? []).map((value) => localizeAttribute(value, locale));
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
      <div className={showStickyContact ? "pb-24 md:pb-0" : undefined}>
      <div className="mx-auto max-w-lg md:max-w-none">
        <Breadcrumbs items={breadcrumbs} />
        <ProfileGallery photos={photos} locale={locale} displayName={profile.displayName} dictionary={dictionary} />

        <div className="mt-5 md:mx-auto md:max-w-lg">
          <h1 className="text-[28px] leading-none font-medium tracking-tight">{h1}</h1>
          {profile.status === "temporarilyUnavailable" && (
            <div className="mt-3 rounded-md bg-[var(--surface)] px-3 py-2 text-[13px] text-[var(--muted)]">
              <p className="font-medium text-[var(--foreground)]">{dictionary.profile.unavailableBadge}</p>
              <p className="mt-0.5">
                {pickLocalizedText(profile.unavailableMessage, locale) || dictionary.profile.contactAnyway}
              </p>
            </div>
          )}
          <p className="mt-2 text-[14px] text-[var(--muted)]">
            <Link href={countryPath(country.slug, locale)} className="underline-offset-2 hover:underline">
              {countryTitle}
            </Link>
            <span aria-hidden="true"> · </span>
            <Link
              href={districtPath(country.slug, profile.district.slug, locale)}
              className="underline-offset-2 hover:underline"
            >
              {districtTitle}
            </Link>
          </p>
          {stats.length > 0 && (
            <p className="mt-3 text-[14px] tabular-nums text-[var(--foreground)]">{stats.join(" · ")}</p>
          )}
          {languages.length > 0 && (
            <p className="mt-1 text-[13px] text-[var(--muted)]">
              {dictionary.profile.speaks} {languages.join(", ")}
            </p>
          )}
          {attributes.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {attributes.map((value) => (
                <span
                  key={value}
                  className="rounded-full bg-[var(--surface)] px-2.5 py-1 text-[11px] text-[var(--muted)]"
                >
                  {value}
                </span>
              ))}
            </div>
          )}

          <div className="mt-5">
            <ContactButtons
              contact={contact}
              context={analyticsContext}
              labels={dictionary.contact}
              layout="bar"
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

        {rest.length > 0 && (
          <div className="mt-8 hidden grid-cols-2 gap-2 md:grid">
            {rest.map((photo, index) => (
              <div key={`more-${photo.asset?._ref ?? index}`} className="relative aspect-[3/4] overflow-hidden bg-[#ddd8d0]">
                <CatalogPhoto
                  photo={photo}
                  locale={locale}
                  fallbackAlt={profile.displayName}
                  sizes="(min-width: 768px) 35vw, 50vw"
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {similar.length > 0 && (
        <section className="mt-12 md:mb-8">
          <h2 className="mb-3 text-[16px] font-medium">{dictionary.profile.similar}</h2>
          <ProfileGrid profiles={similar} locale={locale} dictionary={dictionary} />
        </section>
      )}
      </div>

      {showStickyContact && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--line)] bg-[var(--background)]/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
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
