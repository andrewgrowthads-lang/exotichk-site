const PROFILE_STATUSES = ["active", "temporarilyUnavailable", "archived"] as const;
export type ProfileStatus = (typeof PROFILE_STATUSES)[number];

/** Mirrors `profile.price` in the Sanity schema: optional, integer 1–999999. */
export const PRICE_REQUIRED_BY_SCHEMA = false;
export const PRICE_MIN = 1;
export const PRICE_MAX = 999999;
export const AGE_MIN = 18;
export const AGE_MAX = 99;
export const HEIGHT_MIN = 100;
export const HEIGHT_MAX = 220;
export const GALLERY_MAX = 11;

export const REQUIRED_CSV_COLUMNS = [
  "display_name",
  "country",
  "district",
  "summary_en",
  "image_folder",
] as const;

export const OPTIONAL_CSV_COLUMNS = [
  "status",
  "age",
  "height",
  "nationality",
  "languages",
  "price_hkd",
  "description_en",
  "featured",
  "sort_order",
] as const;

export function parseLanguages(value: string): string[] {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

export function parseBoolean(raw: string, field: string): { ok: true; value: boolean } | { ok: false; error: string } {
  const value = raw.trim().toLowerCase();
  if (!value) return { ok: true, value: false };
  if (["true", "1", "yes", "y"].includes(value)) return { ok: true, value: true };
  if (["false", "0", "no", "n"].includes(value)) return { ok: true, value: false };
  return { ok: false, error: `${field} must be true/false (or 1/0/yes/no), got ${JSON.stringify(raw)}` };
}

export function parseStatus(raw: string): { ok: true; value: ProfileStatus } | { ok: false; error: string } {
  const value = raw.trim();
  if (!value) return { ok: true, value: "active" };
  if ((PROFILE_STATUSES as readonly string[]).includes(value)) {
    return { ok: true, value: value as ProfileStatus };
  }
  return {
    ok: false,
    error: `status must be one of ${PROFILE_STATUSES.join(", ")}, got ${JSON.stringify(raw)}`,
  };
}

export function parseOptionalInteger(
  raw: string,
  field: string,
  min: number,
  max: number,
): { ok: true; value?: number } | { ok: false; error: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: true, value: undefined };
  if (!/^-?[0-9]+$/.test(trimmed)) {
    return { ok: false, error: `${field} must be an integer, got ${JSON.stringify(raw)}` };
  }
  const value = Number(trimmed);
  if (value < min || value > max) {
    return { ok: false, error: `${field} must be between ${min} and ${max}` };
  }
  return { ok: true, value };
}

export function parsePriceHkd(raw: string): { ok: true; value?: number } | { ok: false; error: string } {
  const trimmed = raw.trim();
  if (!trimmed) {
    if (PRICE_REQUIRED_BY_SCHEMA) {
      return { ok: false, error: "price_hkd is required" };
    }
    return { ok: true, value: undefined };
  }
  if (!/^[0-9]+$/.test(trimmed)) {
    return { ok: false, error: `price_hkd must be a positive integer with no currency symbol, got ${JSON.stringify(raw)}` };
  }
  const value = Number(trimmed);
  if (value < PRICE_MIN || value > PRICE_MAX) {
    return { ok: false, error: `price_hkd must be between ${PRICE_MIN} and ${PRICE_MAX}` };
  }
  return { ok: true, value };
}

export function normalizeMatchKey(value: string): string {
  return value.trim().toLowerCase().replace(/[_]+/g, " ").replace(/\s+/g, " ");
}

const COUNTRY_ALIASES: Record<string, string> = {
  "hong kong": "hong-kong",
  "hong-kong": "hong-kong",
};

const DISTRICT_ALIASES: Record<string, string> = {
  tst: "tst",
  "tsim sha tsui": "tst",
  "tsim sha tsui (尖沙咀)": "tst",
  "wan chai": "wan-chai",
  "wan-chai": "wan-chai",
  "wan chai (灣仔)": "wan-chai",
};

export function countryAliasSlug(value: string): string | undefined {
  return COUNTRY_ALIASES[normalizeMatchKey(value)];
}

export function districtAliasSlug(value: string): string | undefined {
  return DISTRICT_ALIASES[normalizeMatchKey(value)];
}

export function isPublicProfileStatus(status: ProfileStatus): boolean {
  return status === "active" || status === "temporarilyUnavailable";
}
