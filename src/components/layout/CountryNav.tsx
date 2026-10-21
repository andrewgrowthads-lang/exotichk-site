import type { LocaleId } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { loadCountryNav } from "@/sanity/pageData";
import { CountrySwitcher } from "@/components/layout/CountrySwitcher";

export async function CountryNav({
  locale,
  dictionary,
  activeCountrySlug,
}: {
  locale: LocaleId;
  dictionary: Dictionary;
  activeCountrySlug?: string;
}) {
  const countries = await loadCountryNav(locale);
  if (countries.length === 0) return null;

  return (
    <CountrySwitcher
      countries={countries.map(({ image: _image, ...link }) => link)}
      activeSlug={activeCountrySlug}
      placeholder={dictionary.common.location}
      menuLabel={dictionary.common.chooseLocation}
    />
  );
}
