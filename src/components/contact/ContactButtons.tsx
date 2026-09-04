"use client";

import { trackChannelClick, trackContactClick, type ContactMethod, type ProfileContext } from "@/lib/analytics";
import type { ContactLinks } from "@/types/content";

export function ContactButtons({
  contact,
  context,
  labels,
  layout = "stack",
  showChannel = false,
}: {
  contact: ContactLinks;
  /**
   * Analytics context, passed as one object rather than as loose fields so
   * that the in-body and sticky instances on a profile page cannot report
   * different values for the same click.
   */
  context: ProfileContext;
  labels: { telegram: string; whatsapp: string; telegramChannel: string };
  layout?: "stack" | "bar";
  /** Telegram channel is a secondary CTA — opt in only where it should show (not the compact mobile sticky bar). */
  showChannel?: boolean;
}) {
  const bar = layout === "bar";

  return (
    <div className="flex flex-col gap-2">
      <div className={bar ? "grid grid-cols-2 gap-2" : "flex flex-col gap-2"}>
        {contact.whatsappUrl && (
          <a
            href={contact.whatsappUrl}
            rel="noopener noreferrer external"
            className="inline-flex min-h-12 items-center justify-center rounded-md bg-[var(--whatsapp)] px-4 text-[15px] font-medium text-white"
            onClick={() => trackContactClick({ ...context, method: "whatsapp" satisfies ContactMethod })}
          >
            {labels.whatsapp}
          </a>
        )}
        {contact.telegramUrl && (
          <a
            href={contact.telegramUrl}
            rel="noopener noreferrer external"
            className="inline-flex min-h-12 items-center justify-center rounded-md bg-[var(--telegram)] px-4 text-[15px] font-medium text-white"
            onClick={() => trackContactClick({ ...context, method: "telegram" satisfies ContactMethod })}
          >
            {labels.telegram}
          </a>
        )}
      </div>
      {showChannel && contact.telegramChannelUrl && (
        <a
          href={contact.telegramChannelUrl}
          rel="noopener noreferrer external"
          className="inline-flex min-h-10 items-center justify-center rounded-md border border-[var(--line)] px-4 text-[13px] font-medium text-[var(--muted)]"
          onClick={() => trackChannelClick(context)}
        >
          {labels.telegramChannel}
        </a>
      )}
    </div>
  );
}
