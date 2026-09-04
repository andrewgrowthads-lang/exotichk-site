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
    <nav aria-label={dictionary.common.countries} className="flex items-center gap-1.5 text-[13px]">
      {countries.map((country, index) => {
        const href = countryNavHref(country.slug, homeCountrySlug, locale);
        const current = country.slug === activeCountrySlug;
        return (
          <span key={country.slug} className="flex items-center gap-1.5">
            {index > 0 && (
              <span aria-hidden="true" className="text-[var(--line)]">
                |
              </span>
            )}
            {current ? (
              <span aria-current="page" className="font-medium text-[var(--foreground)]">
                {country.title}
              </span>
            ) : (
              <Link href={href} className="text-[var(--muted)] hover:text-[var(--foreground)]">
                {country.title}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
