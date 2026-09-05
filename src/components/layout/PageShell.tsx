import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { locales, type LocaleId } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { homePath } from "@/lib/urls";
import { CatalogFrame } from "@/components/layout/CatalogFrame";
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
    <nav aria-label="Language" className="flex shrink-0 items-center gap-1.5 text-[11px] font-medium tracking-[0.14em] uppercase">
      {items.map(({ entry, href }, index) => (
        <span key={entry.id} className="flex items-center gap-1.5">
          {index > 0 && (
            <span aria-hidden="true" className="text-[var(--accent)]/50">
              |
            </span>
          )}
          {href ? (
            <Link href={href} hrefLang={entry.hreflang} className="text-[var(--muted)] hover:text-white">
              {entry.shortLabel}
            </Link>
          ) : (
            <span aria-current="true" className="text-white">
              {entry.shortLabel}
            </span>
          )}
        </span>
      ))}
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
    <div className="relative z-10 flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-[var(--accent)]/28 bg-[var(--background)]/78 backdrop-blur-md">
        <CatalogFrame className="flex h-12 items-center justify-between gap-3 sm:h-[3.25rem]">
          <Link
            href={homePath(locale)}
            className="shrink-0 text-[13px] font-semibold tracking-[0.22em] uppercase sm:text-[14px]"
            aria-label={dictionary.common.siteName}
          >
            <span className="text-white">Exotic</span>
            <span className="text-[var(--accent)]">HK</span>
          </Link>
          <div className="flex min-w-0 items-center justify-end gap-3 sm:gap-5">
            <Suspense fallback={<span className="min-h-[1em]" />}>
              <CountryNav locale={locale} dictionary={dictionary} activeCountrySlug={activeCountrySlug} />
            </Suspense>
            <LanguageSwitcher locale={locale} alternateHref={alternateHref} />
          </div>
        </CatalogFrame>
      </header>
      <main className="flex-1">{children}</main>
      {footer && (
        <footer className="mt-auto border-t border-[var(--line)] py-6">
          <CatalogFrame className="flex items-center justify-between gap-3 text-[12px] text-[var(--muted)]">
            <p>
              © {new Date().getFullYear()} {dictionary.common.siteName}
            </p>
            <p className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--accent)]/50 text-[10px] tracking-wide text-[var(--accent-soft)]">
              {dictionary.common.adultsOnly}
            </p>
          </CatalogFrame>
        </footer>
      )}
    </div>
  );
}
