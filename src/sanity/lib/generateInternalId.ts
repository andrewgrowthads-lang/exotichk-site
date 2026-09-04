/**
 * Stable unique internal ID. CSPRNG bytes — not a document-count counter —
 * so two editors creating profiles at once cannot mint the same sequence
 * number. Uniqueness is still enforced in the schema validator.
 */
export function generateInternalId(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
  return `HK${hex}`;
}
