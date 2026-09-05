import { countryAliasSlug, districtAliasSlug, normalizeMatchKey } from "./fields";

export interface CountryRecord {
  _id: string;
  slug: string;
  status: string;
  internalName: string;
  titleEn: string;
}

export interface DistrictRecord {
  _id: string;
  slug: string;
  status: string;
  internalName: string;
  titleEn: string;
  countryId: string;
}

function matchesName(record: { slug: string; internalName: string; titleEn: string }, input: string): boolean {
  const key = normalizeMatchKey(input);
  return (
    normalizeMatchKey(record.slug) === key ||
    normalizeMatchKey(record.internalName) === key ||
    normalizeMatchKey(record.titleEn) === key
  );
}

export function resolveCountry(countries: CountryRecord[], input: string): CountryRecord | undefined {
  const aliased = countryAliasSlug(input);
  if (aliased) {
    const bySlug = countries.find((country) => country.slug === aliased);
    if (bySlug) return bySlug;
  }
  return countries.find((country) => matchesName(country, input));
}

export function resolveDistrict(districts: DistrictRecord[], input: string): DistrictRecord | undefined {
  const aliased = districtAliasSlug(input);
  if (aliased) {
    const bySlug = districts.find((district) => district.slug === aliased);
    if (bySlug) return bySlug;
  }
  return districts.find((district) => matchesName(district, input));
}
