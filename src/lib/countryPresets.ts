import { isCurrencyCode, type CurrencyCode } from "@/lib/formatPrice";

/**
 * Presentation defaults bundled with the code, keyed by country slug.
 * Everything editorial (titles, contacts, districts, background override,
 * currency) lives on the Sanity `country` document; this only covers what
 * must ship as a static file — flags and the licensed fallback photos in
 * `public/atmosphere/` — plus a currency safety net for documents created
 * before the `currency` field existed. A country without an entry here
 * still works: it gets no flag and the neutral background.
 */

export interface AtmospherePhoto {
  /** Path prefix of the pre-encoded responsive set in `public/atmosphere/`. */
  base: string;
  /** CSS `object-position` for the landscape frame. */
  objectPosition: string;
  credit: { author: string; license: string; licenseUrl: string };
}

interface CountryPreset {
  currency: CurrencyCode;
  flag: string;
  photo: AtmospherePhoto;
}

const CC_BY_SA_4 = { license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/" };

const COUNTRY_PRESETS: Record<string, CountryPreset> = {
  "hong-kong": {
    currency: "HKD",
    flag: "/flags/hong-kong.svg",
    photo: {
      base: "/atmosphere/hong-kong-harbour-night",
      objectPosition: "center 38%",
      credit: { author: "Benh LIEU SONG", ...CC_BY_SA_4 },
    },
  },
  singapore: {
    currency: "SGD",
    flag: "/flags/singapore.svg",
    photo: {
      base: "/atmosphere/singapore-marina-bay-night",
      objectPosition: "center 55%",
      credit: { author: "Dietmar Rabich", ...CC_BY_SA_4 },
    },
  },
};

function preset(slug: string | undefined): CountryPreset | undefined {
  return slug && Object.prototype.hasOwnProperty.call(COUNTRY_PRESETS, slug) ? COUNTRY_PRESETS[slug] : undefined;
}

export function countryFlagSrc(slug: string | undefined): string | undefined {
  return preset(slug)?.flag;
}

export function countryPhoto(slug: string | undefined): AtmospherePhoto | undefined {
  return preset(slug)?.photo;
}

/** The country document's own currency wins; the preset only covers documents that predate the field. */
export function resolveCurrency(country: { slug: string; currency?: string }): CurrencyCode | undefined {
  if (isCurrencyCode(country.currency)) return country.currency;
  return preset(country.slug)?.currency;
}
