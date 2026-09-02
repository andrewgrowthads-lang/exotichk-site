"use client";

import type { LocaleId } from "@/i18n/config";
import { trackChannelClick, trackContactClick, type ContactMethod } from "@/lib/analytics";
import type { ContactLinks } from "@/types/content";

interface ContactButtonsProps {
  contact: ContactLinks;
  profile: string;
  country: string;
  district: string;
  locale: LocaleId;
  labels: { telegram: string; whatsapp: string; telegramChannel: string };
}

/**
 * Renders plain `<a href>` elements — they navigate on their own with no
 * JavaScript required. `onClick` only fires an analytics event on top of
 * the browser's default navigation; it never performs the navigation
 * itself. This is the site's only real conversion action, so it cannot
 * depend on hydration succeeding.
 */
export function ContactButtons({ contact, profile, country, district, locale, labels }: ContactButtonsProps) {
  const trackingContext = { profile, country, district, locale };

  const buttonClass =
    "inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-base font-medium text-white transition active:scale-[0.98] sm:w-auto";

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      {contact.telegramUrl && (
        <a
          href={contact.telegramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`${buttonClass} bg-sky-500 hover:bg-sky-600`}
          onClick={() => trackContactClick({ ...trackingContext, method: "telegram" satisfies ContactMethod })}
        >
          {labels.telegram}
        </a>
      )}
      {contact.whatsappUrl && (
        <a
          href={contact.whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`${buttonClass} bg-emerald-500 hover:bg-emerald-600`}
          onClick={() => trackContactClick({ ...trackingContext, method: "whatsapp" satisfies ContactMethod })}
        >
          {labels.whatsapp}
        </a>
      )}
      {contact.telegramChannelUrl && (
        <a
          href={contact.telegramChannelUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-neutral-300 px-4 py-3 text-base font-medium text-neutral-700 transition hover:bg-neutral-50 sm:w-auto dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-900"
          onClick={() => trackChannelClick(trackingContext)}
        >
          {labels.telegramChannel}
        </a>
      )}
    </div>
  );
}
