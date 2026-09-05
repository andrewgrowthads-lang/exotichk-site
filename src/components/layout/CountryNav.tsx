import Link from "next/link";
import type { LocaleId } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { countryNavHref } from "@/lib/countryNav";
import { loadCountryNav } from "@/sanity/pageData";
import { HongKongFlag } from "@/components/brand/HongKongFlag";

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
      className="flex min-w-0 items-center justify-end gap-1.5 overflow-x-auto hide-scrollbar"
    >
      {countries.map((country) => {
        const href = countryNavHref(country.slug, homeCountrySlug, locale);
        const current = country.slug === activeCountrySlug;
        const className = `flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium tracking-[0.14em] uppercase transition-colors sm:px-2.5 ${
          current
            ? "bg-[var(--surface-2)] text-white shadow-[0_0_16px_rgba(255,45,138,0.28)] ring-1 ring-[var(--accent)]/70"
            : "text-[var(--muted)] hover:text-white hover:ring-1 hover:ring-[var(--accent)]/35"
        }`;
        const label = (
          <>
            {country.slug === "hong-kong" && (
              <HongKongFlag className="h-3.5 w-[21px] rounded-[2px] ring-1 ring-white/20" />
            )}
            {country.title}
          </>
        );
        return current ? (
          <span key={country.slug} aria-current="page" className={className}>
            {label}
          </span>
        ) : (
          <Link key={country.slug} href={href} className={className}>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
