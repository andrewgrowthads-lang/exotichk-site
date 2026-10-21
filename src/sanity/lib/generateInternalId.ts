const PREFIX_BY_COUNTRY: Record<string, string> = {
  "hong-kong": "HK",
  singapore: "SG",
};

/**
 * Stable unique internal ID. CSPRNG bytes — not a document-count counter —
 * so two editors creating profiles at once cannot mint the same sequence
 * number. Uniqueness is still enforced in the schema validator.
 *
 * The prefix is cosmetic (it appears in the visitor's pre-filled WhatsApp
 * message) and is fixed at creation; existing IDs are never rewritten.
 */
export function generateInternalId(countrySlug?: string): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
  const prefix =
    countrySlug && Object.prototype.hasOwnProperty.call(PREFIX_BY_COUNTRY, countrySlug)
      ? PREFIX_BY_COUNTRY[countrySlug]
      : "HK";
  return `${prefix}${hex}`;
}
