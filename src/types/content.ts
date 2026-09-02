/** Shape of the `localeString` / `localeText` Sanity object types. */
export interface LocalizedText {
  en: string;
  zhHantHK?: string;
}

export interface SanityImage {
  asset?: {
    _ref?: string;
    url?: string;
    metadata?: {
      dimensions?: { width: number; height: number };
      lqip?: string;
    };
  };
  hotspot?: { x: number; y: number; height: number; width: number };
  alt?: LocalizedText;
}

export type CountryStatus = "active" | "archived";
export type DistrictStatus = "active" | "archived";
export type ProfileStatus = "active" | "temporarilyUnavailable" | "archived";

export interface ContactLinks {
  telegramUrl?: string;
  whatsappUrl?: string;
  telegramChannelUrl?: string;
}

export interface CountrySummary {
  _id: string;
  slug: string;
  status: CountryStatus;
  title: LocalizedText;
  intro: LocalizedText;
  image?: SanityImage;
  sortOrder: number;
  updatedAt: string;
}

export interface CountryDetail extends CountrySummary {
  seoTitle?: LocalizedText;
  seoDescription?: LocalizedText;
}

export interface DistrictSummary {
  _id: string;
  slug: string;
  status: DistrictStatus;
  title: LocalizedText;
  intro: LocalizedText;
  image?: SanityImage;
  sortOrder: number;
  updatedAt: string;
  country: { slug: string };
}

export interface DistrictDetail extends DistrictSummary {
  seoTitle?: LocalizedText;
  seoDescription?: LocalizedText;
}

export interface ProfileSummary {
  _id: string;
  slug: string;
  status: ProfileStatus;
  displayName: string;
  summary: LocalizedText;
  images: SanityImage[];
  sortOrder: number;
  updatedAt: string;
  country: { slug: string };
  district: { slug: string; title: LocalizedText };
}

export interface ProfileDetail extends ProfileSummary {
  body?: LocalizedText;
  attributes?: string[];
  seoTitle?: LocalizedText;
  seoDescription?: LocalizedText;
  unavailableMessage?: LocalizedText;
  publishedAt?: string;
  contact: ContactLinks;
}

export interface SiteSettings {
  agencyName: string;
  agencyDescription?: LocalizedText;
  defaultSeoTitle?: LocalizedText;
  defaultSeoDescription?: LocalizedText;
  defaultSocialImage?: SanityImage;
  contact: ContactLinks;
}
