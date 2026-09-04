import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { locales, type LocaleId } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { homePath } from "@/lib/urls";
import { CountryNav } from "@/components/layout/CountryNav";

/**
 * "EN | 中文" toggle: the current locale is plain text (nothing to click
 * into), every other locale is a link to the exact same entity in that
 * language — never the homepage. A locale is omitted entirely rather
 * than shown disabled when its equivalent page isn't published yet (see
 * `lib/visibility.ts`), so this scales to more than two locales without
 * changes here.
 */
function LanguageSwitcher({ locale, alternateHref }: { locale: LocaleId; alternateHref?: string }) {
  const items = locales
    .map((entry) => ({
      entry,
      href: entry.id === locale ? undefined : alternateHref,
    }))
    .filter((item) => item.entry.id === locale || Boolean(item.href));

  if (items.length < 2) return null;

  return (
    <nav
      aria-label="Language"
      className="flex shrink-0 rounded-md border border-[var(--accent)]/45 p-0.5 text-[10px] font-medium tracking-[0.16em] uppercase"
    >
      {items.map(({ entry, href }) =>
        href ? (
          <Link
            key={entry.id}
            href={href}
            hrefLang={entry.hreflang}
            className="rounded-[5px] px-2.5 py-1 text-[var(--muted)] transition-colors hover:text-white"
          >
            {entry.shortLabel}
          </Link>
        ) : (
          <span
            key={entry.id}
            aria-current="true"
            className="rounded-[5px] bg-[var(--accent)] px-2.5 py-1 text-white"
          >
            {entry.shortLabel}
          </span>
        ),
      )}
    </nav>
  );
}

export function PageShell({
  locale,
  dictionary,
  alternateHref,
  children,
  footer = true,
  activeCountrySlug,
}: {
  locale: LocaleId;
  dictionary: Dictionary;
  alternateHref?: string;
  children: ReactNode;
  footer?: boolean;
  activeCountrySlug?: string;
}) {
  return (
    <div className="relative z-10 flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-[var(--accent)]/20 bg-[var(--background)]/80 backdrop-blur-md">
        <div className="mx-auto flex h-12 max-w-6xl items-center justify-between gap-3 px-3 sm:h-14 sm:px-4">
          <Link
            href={homePath(locale)}
            className="shrink-0 text-[13px] font-semibold tracking-[0.22em] uppercase"
            aria-label={dictionary.common.siteName}
          >
            <span className="text-white">Exotic</span>
            <span className="text-[var(--accent)]">HK</span>
          </Link>
          <Suspense fallback={<span className="min-h-[1em] flex-1" />}>
            <CountryNav locale={locale} dictionary={dictionary} activeCountrySlug={activeCountrySlug} />
          </Suspense>
          <LanguageSwitcher locale={locale} alternateHref={alternateHref} />
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-3 pt-3 pb-8 sm:px-4 sm:pt-4">{children}</main>
      {footer && (
        <footer className="border-t border-[var(--line)] py-6">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-3 text-[12px] text-[var(--muted)] sm:px-4">
            <p>
              © {new Date().getFullYear()} {dictionary.common.siteName}
            </p>
            <p className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--accent)]/50 text-[10px] tracking-wide text-[var(--accent-soft)]">
              {dictionary.common.adultsOnly}
            </p>
          </div>
        </footer>
      )}
    </div>
  );
}
