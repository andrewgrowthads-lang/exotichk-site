import Link from "next/link";
import type { LocaleId } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { countryNavHref } from "@/lib/countryNav";
import { loadCountryNav } from "@/sanity/pageData";

export async function CountryNav({
  locale,
  dictionary,
  activeCountrySlug,
}: {
  locale: LocaleId;
  dictionary: Dictionary;
  activeCountrySlug?: string;
}) {
  const { countries, homeCountrySlug } = await loadCountryNav(locale);
  if (countries.length === 0) return null;

  return (
    <nav
      aria-label={dictionary.common.countries}
      className="flex min-w-0 flex-1 items-center justify-center gap-1.5 overflow-x-auto hide-scrollbar"
    >
      {countries.map((country) => {
        const href = countryNavHref(country.slug, homeCountrySlug, locale);
        const current = country.slug === activeCountrySlug;
        const className = `shrink-0 rounded-md px-2.5 py-1 text-[11px] font-medium tracking-[0.12em] uppercase transition-colors ${
          current
            ? "bg-[var(--surface-2)] text-white ring-1 ring-[var(--accent)]/70"
            : "text-[var(--muted)] hover:text-white"
        }`;
        return current ? (
          <span key={country.slug} aria-current="page" className={className}>
            {country.title}
          </span>
        ) : (
          <Link key={country.slug} href={href} className={className}>
            {country.title}
          </Link>
        );
      })}
    </nav>
  );
}
