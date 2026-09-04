const dictionary = {
  common: {
    siteName: "ExoticHK",
    home: "Home",
    countries: "Destinations",
    districts: "Districts",
    profiles: "Profiles",
    all: "All",
    breadcrumbHome: "Home",
  },
  home: {
    heading: "Explore Hong Kong",
    intro: "Browse by district, discover featured profiles, or open the complete Hong Kong catalogue.",
    featured: "Featured profiles",
    viewCountry: "View all Hong Kong profiles",
  },
  contact: {
    telegram: "Telegram",
    whatsapp: "WhatsApp",
    telegramChannel: "Telegram Channel",
  },
  listing: {
    empty: "No profiles are listed here at the moment.",
    emptyHint: "Try another district, or check back soon.",
  },
  profile: {
    unavailableBadge: "Temporarily unavailable",
    contactAnyway: "Contact the manager",
    similar: "More profiles",
    speaks: "Speaks",
  },
  gallery: {
    openPhoto: "Open photo",
    close: "Close",
  },
  notFound: {
    title: "Page not found",
    description: "This page does not exist or is no longer available.",
    backHome: "Back to homepage",
  },
  footer: {
    rights: "All rights reserved.",
  },
} as const;

type DeepStringify<T> = {
  [K in keyof T]: T[K] extends string ? string : DeepStringify<T[K]>;
};

export type Dictionary = DeepStringify<typeof dictionary>;
export default dictionary;
