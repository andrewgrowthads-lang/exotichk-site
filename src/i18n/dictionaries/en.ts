const dictionary = {
  common: {
    siteName: "ExoticHK",
    home: "Home",
    countries: "Destinations",
    districts: "Districts",
    profiles: "Profiles",
    breadcrumbHome: "Home",
  },
  nav: {
    switchLanguage: "繁體中文",
  },
  contact: {
    telegram: "Message on Telegram",
    whatsapp: "Message on WhatsApp",
    telegramChannel: "Join our Telegram channel",
  },
  profile: {
    unavailableBadge: "Temporarily unavailable",
    contactAnyway: "Contact the manager",
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
