import type { LocaleId } from "@/i18n/config";
import type { ContactLinks } from "@/types/content";

const CONTACT_HOSTS = {
  telegramUrl: "t.me",
  whatsappUrl: "wa.me",
  telegramChannelUrl: "t.me",
} as const;

type ContactSource = "profile" | "country" | "siteSettings";

/**
 * Before multi-country support, the only contacts lived on the
 * `siteSettings` singleton and every page used them. They belong to Hong
 * Kong, so they still apply there — and only there — until the Hong Kong
 * country document carries contacts of its own (see
 * `scripts/migrate-multi-country.ts`). No other country can ever reach
 * them, which is what keeps Hong Kong managers off Singapore pages.
 */
export const LEGACY_CONTACT_COUNTRY_SLUG = "hong-kong";

/**
 * A link an editor actually filled in but that fails the host check below
 * disappears from the page silently, and the result is indistinguishable
 * from "no contact configured" — on a site whose only purpose is the CTA,
 * that is the most expensive possible failure to not notice. Surface it
 * in the server logs instead.
 *
 * The rejected URL is never logged: it carries the manager's phone number
 * or Telegram handle. The field name, where it came from, and why it was
 * rejected are enough to find it in Studio.
 */
function warnRejectedContactUrl(
  key: keyof typeof CONTACT_HOSTS,
  source: ContactSource,
  reason: string,
): void {
  console.warn(
    `[contact] Ignored ${source}.${key}: ${reason}. Expected https://${CONTACT_HOSTS[key]}/… with no credentials and no custom port.`,
  );
}

function safeContactUrl(
  value: string | undefined,
  key: keyof typeof CONTACT_HOSTS,
  source: ContactSource,
): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") {
      warnRejectedContactUrl(key, source, `protocol "${url.protocol}" is not https:`);
      return undefined;
    }
    if (url.hostname !== CONTACT_HOSTS[key]) {
      warnRejectedContactUrl(key, source, `host "${url.hostname}" is not allowed`);
      return undefined;
    }
    if (url.username || url.password || url.port) {
      warnRejectedContactUrl(key, source, "URL carries credentials or a custom port");
      return undefined;
    }
    return url.toString();
  } catch {
    warnRejectedContactUrl(key, source, "value is not a parsable absolute URL");
    return undefined;
  }
}

function hasAnyContact(contact: ContactLinks | undefined): boolean {
  return Boolean(contact?.telegramUrl || contact?.whatsappUrl || contact?.telegramChannelUrl);
}

function safeContactLinks(contact: ContactLinks | undefined, source: ContactSource): ContactLinks {
  return {
    telegramUrl: safeContactUrl(contact?.telegramUrl, "telegramUrl", source),
    whatsappUrl: safeContactUrl(contact?.whatsappUrl, "whatsappUrl", source),
    telegramChannelUrl: safeContactUrl(contact?.telegramChannelUrl, "telegramChannelUrl", source),
  };
}

/**
 * The manager contacts for one country. A country's own fields are used
 * as a set: once any of them is filled in, an empty one means "hide that
 * button", never "borrow it from somewhere else".
 */
export function resolveCountryContact(
  country: { slug: string; contact?: ContactLinks },
  legacySiteContact: ContactLinks | undefined,
): ContactLinks {
  if (hasAnyContact(country.contact)) return safeContactLinks(country.contact, "country");
  if (country.slug === LEGACY_CONTACT_COUNTRY_SLUG) return safeContactLinks(legacySiteContact, "siteSettings");
  return {};
}

/** Explicit profile-level overrides win field by field; otherwise the profile's own country's contacts. */
export function resolveContact(profileContact: ContactLinks, countryContact: ContactLinks): ContactLinks {
  const profile = safeContactLinks(profileContact, "profile");
  return {
    telegramUrl: profile.telegramUrl || countryContact.telegramUrl,
    whatsappUrl: profile.whatsappUrl || countryContact.whatsappUrl,
    telegramChannelUrl: profile.telegramChannelUrl || countryContact.telegramChannelUrl,
  };
}

/**
 * Whether there is a direct line to the manager. The sticky mobile bar
 * exists only to hold these two buttons, so it must not render without
 * at least one of them — an empty fixed bar is a permanent strip of
 * nothing across the bottom of the screen. The Telegram *channel* is a
 * secondary link and deliberately does not count: it cannot start a
 * conversation on its own.
 */
export function hasDirectContact(contact: ContactLinks): boolean {
  return Boolean(contact.whatsappUrl || contact.telegramUrl);
}

export interface WhatsAppMessageParams {
  /** Public display name, e.g. "Anna". */
  name: string;
  /** Editor-only internal ID, e.g. "HK015" — never shown on the page itself. */
  internalId: string;
}

/**
 * Single source of truth for what a visitor's WhatsApp message says when
 * they tap "Contact on WhatsApp". Change the copy here — nothing else
 * needs to change. Keep it short: this is pre-filled into the visitor's
 * own message box, not sent on their behalf, so they can still edit it
 * before hitting send.
 */
const WHATSAPP_MESSAGE_BY_LOCALE: Record<LocaleId, (params: WhatsAppMessageParams) => string> = {
  en: ({ name, internalId }) => `Hi! I'm interested in ${name} — ${internalId}.`,
  "zh-Hant-HK": ({ name, internalId }) => `你好，我對 ${name}（${internalId}）有興趣。`,
};

export function buildWhatsAppMessage(locale: LocaleId, params: WhatsAppMessageParams): string {
  const build = WHATSAPP_MESSAGE_BY_LOCALE[locale] ?? WHATSAPP_MESSAGE_BY_LOCALE.en;
  return build(params);
}

/**
 * Appends the pre-filled message to a `wa.me` link via WhatsApp's own
 * `text` query parameter (the documented "click to chat" API — not a
 * custom/UTM-style param, so it does not risk breaking the deep link).
 * Falls back to the untouched URL if it is somehow not a valid URL.
 */
export function buildWhatsAppUrl(baseUrl: string, locale: LocaleId, params: WhatsAppMessageParams): string {
  try {
    const url = new URL(baseUrl);
    url.searchParams.set("text", buildWhatsAppMessage(locale, params));
    return url.toString();
  } catch {
    return baseUrl;
  }
}
