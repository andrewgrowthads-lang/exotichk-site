import Image from "next/image";
import Link from "next/link";
import type { LocaleId } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { CountryFlag } from "@/components/brand/CountryFlag";
import { CatalogFrame } from "@/components/layout/CatalogFrame";
import { PageShell } from "@/components/layout/PageShell";
import { LocalPhoto, PhotoCredit } from "@/components/media/LocalPhoto";
import { JsonLd, organizationJsonLd, websiteJsonLd } from "@/components/seo/JsonLd";
import { countryPhoto, type AtmospherePhoto } from "@/lib/countryPresets";
import { absoluteUrl, homePath } from "@/lib/urls";
import { imageObjectPosition, urlFor } from "@/sanity/image";
import type { CountryLink } from "@/sanity/pageData";

const CARD_SIZES = "(min-width: 1024px) 512px, (min-width: 640px) 50vw, 100vw";

function CountryCard({
  country,
  dictionary,
  englishDisplay,
  priority,
}: {
  country: CountryLink;
  dictionary: Dictionary;
  englishDisplay: boolean;
  priority: boolean;
}) {
  const cmsImage = country.image?.asset ? country.image : undefined;
  const photo = cmsImage ? undefined : countryPhoto(country.slug);

  return (
    <Link
      href={country.href}
      hrefLang={country.hrefLang}
      className="group relative block overflow-hidden rounded-2xl border border-white/12 bg-[var(--surface)] shadow-[0_18px_48px_rgba(0,0,0,0.5)] transition duration-300 hover:border-[var(--accent)]/60 hover:shadow-[0_14px_44px_rgba(255,45,138,0.24)] focus-visible:border-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-[var(--surface-2)] sm:aspect-[4/3] lg:aspect-[16/12]">
        {cmsImage ? (
          <Image
            src={urlFor(cmsImage).url()}
            alt=""
            fill
            sizes={CARD_SIZES}
            priority={priority}
            className="object-cover saturate-125 transition duration-500 md:group-hover:scale-[1.03]"
            style={{ objectPosition: imageObjectPosition(cmsImage) ?? "center" }}
          />
        ) : photo ? (
          <LocalPhoto
            photo={photo}
            sizes={CARD_SIZES}
            fetchPriority={priority ? "high" : "auto"}
            lazy={!priority}
            className="absolute inset-0 h-full w-full object-cover saturate-125 transition duration-500 md:group-hover:scale-[1.03]"
          />
        ) : (
          <div
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_20%,rgba(255,45,138,0.28),transparent_60%),radial-gradient(ellipse_at_10%_90%,rgba(92,18,78,0.55),transparent_65%)]"
            aria-hidden="true"
          />
        )}
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/10"
          aria-hidden="true"
        />
        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
          <span className="flex items-center gap-3">
            <CountryFlag
              slug={country.slug}
              className="h-6 w-9 rounded-[3px] shadow-[0_0_18px_rgba(255,45,138,0.4)] ring-1 ring-white/30 sm:h-7 sm:w-[42px]"
            />
            <span
              lang={country.lang}
              className={`text-[26px] leading-none font-semibold text-white [text-shadow:0_2px_24px_rgba(0,0,0,0.85)] sm:text-[32px] lg:text-[36px] ${
                englishDisplay || country.lang ? "tracking-[0.16em] uppercase" : "tracking-wide"
              }`}
            >
              {country.title}
            </span>
          </span>
          <span className="mt-3 flex items-center gap-2 text-[12px] font-medium tracking-[0.18em] text-[var(--accent-soft)] uppercase [text-shadow:0_1px_12px_rgba(0,0,0,0.8)]">
            {dictionary.selector.viewProfiles}
            <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
            {country.lang && (
              <span className="rounded border border-white/25 px-1.5 py-0.5 text-[10px] tracking-[0.12em] text-white/75">
                {dictionary.selector.inEnglish}
              </span>
            )}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function CountrySelectorView({
  locale,
  dictionary,
  countries,
  alternateHref,
  logoUrl,
  agencyName,
  agencyDescription,
}: {
  locale: LocaleId;
  dictionary: Dictionary;
  countries: CountryLink[];
  alternateHref?: string;
  logoUrl?: string;
  agencyName?: string;
  agencyDescription?: string;
}) {
  const siteName = agencyName || dictionary.common.siteName;
  const englishDisplay = locale === "en";
  const credited = countries
    .filter((country) => !country.image?.asset)
    .map((country) => countryPhoto(country.slug))
    .filter((photo): photo is AtmospherePhoto => Boolean(photo));

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
      <JsonLd data={websiteJsonLd({ name: siteName, url: absoluteUrl(homePath(locale)), language: locale })} />
      <CatalogFrame className="pt-7 pb-12 sm:pt-12 lg:pt-14">
        <div className="mx-auto max-w-[1080px]">
          <p className="text-[12px] tracking-[0.2em] text-[var(--accent-soft)] uppercase [text-shadow:0_1px_12px_rgba(0,0,0,0.8)] sm:text-[13px]">
            {dictionary.common.tagline}
          </p>
          <h1
            className={`mt-2 text-[27px] leading-tight font-semibold text-white [text-shadow:0_2px_24px_rgba(0,0,0,0.85)] sm:text-[40px] lg:text-[48px] ${
              englishDisplay ? "tracking-[0.16em] uppercase" : "tracking-wide"
            }`}
          >
            {dictionary.selector.heading}
          </h1>
          <span className="mt-3 block h-px w-16 bg-[var(--accent)] shadow-[0_0_12px_var(--accent)]" aria-hidden="true" />
          <p className="mt-3 text-[14px] text-[var(--muted)] [text-shadow:0_1px_14px_rgba(0,0,0,0.85)] sm:text-[15px]">
            {dictionary.selector.subtitle}
          </p>

          {countries.length > 0 ? (
            <ul className="mt-6 grid gap-3 sm:mt-8 sm:grid-cols-2 sm:gap-5">
              {countries.map((country, index) => (
                <li key={country.slug}>
                  <CountryCard
                    country={country}
                    dictionary={dictionary}
                    englishDisplay={englishDisplay}
                    priority={index === 0}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-8 rounded-xl border border-[var(--accent)]/20 bg-[var(--surface)] px-4 py-10 text-center text-[14px] text-[var(--muted)]">
              {dictionary.selector.empty}
            </p>
          )}

          {agencyDescription && (
            <p className="mt-8 max-w-2xl text-[13px] leading-relaxed text-[var(--muted)] [text-shadow:0_1px_14px_rgba(0,0,0,0.85)]">
              {agencyDescription}
            </p>
          )}
          <PhotoCredit photos={credited} className="mt-6 text-[10px] leading-snug text-white/30" />
        </div>
      </CatalogFrame>
    </PageShell>
  );
}
