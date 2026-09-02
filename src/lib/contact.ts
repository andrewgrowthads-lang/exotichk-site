import type { ContactLinks } from "@/types/content";

/** Profile-level overrides win; otherwise fall back to site-wide defaults. */
export function resolveContact(profileContact: ContactLinks, siteContact: ContactLinks | undefined): ContactLinks {
  return {
    telegramUrl: profileContact.telegramUrl || siteContact?.telegramUrl,
    whatsappUrl: profileContact.whatsappUrl || siteContact?.whatsappUrl,
    telegramChannelUrl: profileContact.telegramChannelUrl || siteContact?.telegramChannelUrl,
  };
}
