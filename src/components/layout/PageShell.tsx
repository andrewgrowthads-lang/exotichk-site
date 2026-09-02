import Link from "next/link";
import type { ReactNode } from "react";
import type { LocaleId } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { homePath } from "@/lib/urls";

interface PageShellProps {
  locale: LocaleId;
  dictionary: Dictionary;
  /**
   * Path to the exact equivalent of the current page in the other
   * locale. Omit when no such equivalent is published — the switcher
   * must never link to a page that does not exist.
   */
  alternateHref?: string;
  children: ReactNode;
}

export function PageShell({ locale, dictionary, alternateHref, children }: PageShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-neutral-200 dark:border-neutral-800">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href={homePath(locale)} className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
            {dictionary.common.siteName}
          </Link>
          {alternateHref && (
            <Link href={alternateHref} className="text-sm text-neutral-600 hover:underline dark:text-neutral-400">
              {dictionary.nav.switchLanguage}
            </Link>
          )}
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
      <footer className="border-t border-neutral-200 py-6 dark:border-neutral-800">
        <div className="mx-auto max-w-5xl px-4 text-sm text-neutral-500 dark:text-neutral-400">
          &copy; {new Date().getFullYear()} {dictionary.common.siteName}. {dictionary.footer.rights}
        </div>
      </footer>
    </div>
  );
}
