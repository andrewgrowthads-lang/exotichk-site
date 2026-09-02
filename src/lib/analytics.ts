import { track } from "@vercel/analytics";
import type { LocaleId } from "@/i18n/config";

export type ContactMethod = "telegram" | "whatsapp" | "telegramChannel";

export interface ContactClickPayload {
  profile: string;
  country: string;
  district: string;
  locale: LocaleId;
  method: ContactMethod;
}

/**
 * Fires a `contact_click` analytics event. Must only ever be called from
 * an `onClick` handler attached to a real `<a href>` that already
 * navigates on its own — this function must never be the thing that
 * performs the navigation, so the CTA keeps working with JavaScript
 * disabled or slow to hydrate.
 */
export function trackContactClick(payload: ContactClickPayload): void {
  track("contact_click", { ...payload });
}

export function trackChannelClick(payload: Omit<ContactClickPayload, "method">): void {
  track("channel_click", { ...payload, method: "telegramChannel" satisfies ContactMethod });
}
