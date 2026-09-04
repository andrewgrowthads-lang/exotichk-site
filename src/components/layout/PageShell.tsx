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
    <nav aria-label="Language" className="flex items-center gap-1.5 text-[13px]">
      {items.map(({ entry, href }, index) => (
        <span key={entry.id} className="flex items-center gap-1.5">
          {index > 0 && (
            <span aria-hidden="true" className="text-[var(--line)]">
              |
            </span>
          )}
          {href ? (
            <Link href={href} hrefLang={entry.hreflang} className="text-[var(--muted)] hover:text-[var(--foreground)]">
              {entry.shortLabel}
            </Link>
          ) : (
            <span aria-current="true" className="font-medium text-[var(--foreground)]">
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
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--background)]/92 backdrop-blur-sm">
        <div className="mx-auto flex h-11 max-w-6xl items-center justify-between gap-3 px-3 sm:h-12 sm:px-4">
          <Link href={homePath(locale)} className="shrink-0 text-[13px] font-medium tracking-[0.22em] uppercase">
            {dictionary.common.siteName}
          </Link>
          <Suspense fallback={<span className="min-h-[1em] flex-1" />}>
            <CountryNav locale={locale} dictionary={dictionary} activeCountrySlug={activeCountrySlug} />
          </Suspense>
          <LanguageSwitcher locale={locale} alternateHref={alternateHref} />
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-3 pt-3 pb-8 sm:px-4 sm:pt-4">{children}</main>
      {footer && (
        <footer className="border-t border-[var(--line)] py-5">
          <div className="mx-auto max-w-6xl px-3 text-[12px] text-[var(--muted)] sm:px-4">
            © {new Date().getFullYear()} {dictionary.common.siteName}
          </div>
        </footer>
      )}
    </div>
  );
}
