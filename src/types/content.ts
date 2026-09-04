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
  body?: LocalizedText;
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
  body?: LocalizedText;
  seoTitle?: LocalizedText;
  seoDescription?: LocalizedText;
}

export interface ProfileSummary {
  _id: string;
  slug: string;
  status: ProfileStatus;
  displayName: string;
  summary: LocalizedText;
  /** Main photo first, gallery photos after — already merged in `sanity/queries.ts`. */
  images: SanityImage[];
  featured: boolean;
  /** Editorial override — kept at summary level so the sitemap can exclude these without a detail fetch. */
  seoNoIndex: boolean;
  sortOrder: number;
  updatedAt: string;
  country: { slug: string };
  district: { slug: string; title: LocalizedText };
  age?: number;
  height?: number;
  nationality?: string;
}

/** Minimal profile shape used by sitemap and static-param generation. */
export interface ProfileIndexEntry {
  _id: string;
  slug: string;
  status: ProfileStatus;
  displayName: string;
  summary: LocalizedText;
  seoNoIndex: boolean;
  updatedAt: string;
  country: { slug: string };
  /** Only the slug — the sitemap needs it to count a district's profiles, not to render anything. */
  district: { slug: string };
}

export interface ProfileDetail extends ProfileSummary {
  /** Editor-only label (e.g. "HK015"), never rendered on the page — used only to identify the profile in the WhatsApp opening message. */
  internalName: string;
  body?: LocalizedText;
  age?: number;
  height?: number;
  nationality?: string;
  languages?: string[];
  attributes?: string[];
  seoTitle?: LocalizedText;
  seoDescription?: LocalizedText;
  h1Override?: LocalizedText;
  ogImage?: SanityImage;
  unavailableMessage?: LocalizedText;
  publishedAt?: string;
  contact: ContactLinks;
}

export interface SiteSettings {
  agencyName: string;
  agencyDescription?: LocalizedText;
  logo?: SanityImage;
  defaultSeoTitle?: LocalizedText;
  defaultSeoDescription?: LocalizedText;
  defaultSocialImage?: SanityImage;
  contact: ContactLinks;
}
