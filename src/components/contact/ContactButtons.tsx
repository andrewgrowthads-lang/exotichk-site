"use client";

import { trackChannelClick, trackContactClick, type ContactMethod, type ProfileContext } from "@/lib/analytics";
import type { ContactLinks } from "@/types/content";

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" fill="currentColor">
      <path d="M19.05 4.91A9.82 9.82 0 0 0 12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.34 4.95L2 22l5.27-1.38a9.87 9.87 0 0 0 4.77 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.91-7.01Zm-7.01 15.24h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.13.82.84-3.05-.2-.31a8.2 8.2 0 0 1-1.26-4.37c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.42 5.83c0 4.55-3.7 8.23-8.25 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.12-.16.25-.64.8-.78.97-.14.16-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.42h-.47c-.16 0-.43.06-.66.31-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.23-.16-.48-.29Z" />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" fill="currentColor">
      <path d="M21.9 4.35c-.21-.18-.52-.22-.95-.1L2.86 9.62c-.43.13-.72.32-.86.56-.14.25-.14.52 0 .8.13.25.4.45.82.61l4.7 1.53 1.8 5.73c.1.33.27.58.5.73.13.09.28.13.43.13.1 0 .2-.02.3-.05.22-.07.4-.22.54-.46l2.6-4.4 5.08 3.73c.172.16.1.2.5.28.1.02.2.03.29.03.22 0 .42-.06.58-.18.27-.2.43-.52.48-.97l1.96-11.7c.08-.5.02-.86-.2-1.04ZM8.7 13.02l8.86-5.58c.16-.1.3-.05.2.1l-7.56 6.82-.2 2.96-1.3-4.3Z" />
    </svg>
  );
}

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
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[var(--whatsapp)] px-4 text-[15px] font-medium tracking-wide text-white"
            onClick={() => trackContactClick({ ...context, method: "whatsapp" satisfies ContactMethod })}
          >
            <WhatsAppIcon />
            {labels.whatsapp}
          </a>
        )}
        {contact.telegramUrl && (
          <a
            href={contact.telegramUrl}
            rel="noopener noreferrer external"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[var(--telegram)] px-4 text-[15px] font-medium tracking-wide text-white"
            onClick={() => trackContactClick({ ...context, method: "telegram" satisfies ContactMethod })}
          >
            <TelegramIcon />
            {labels.telegram}
          </a>
        )}
      </div>
      {showChannel && contact.telegramChannelUrl && (
        <a
          href={contact.telegramChannelUrl}
          rel="noopener noreferrer external"
          className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[var(--line)] px-4 text-[13px] font-medium text-[var(--muted)] hover:border-[var(--accent)]/50 hover:text-[var(--foreground)]"
          onClick={() => trackChannelClick(context)}
        >
          {labels.telegramChannel}
        </a>
      )}
    </div>
  );
}
