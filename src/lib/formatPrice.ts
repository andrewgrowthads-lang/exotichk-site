export const CURRENCY_SYMBOLS = {
  HKD: "HK$",
  SGD: "S$",
} as const;

export type CurrencyCode = keyof typeof CURRENCY_SYMBOLS;

export const CURRENCY_CODES = Object.keys(CURRENCY_SYMBOLS) as CurrencyCode[];

export function isCurrencyCode(value: unknown): value is CurrencyCode {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(CURRENCY_SYMBOLS, value);
}

/**
 * Formats a numeric price as `HK$ 1500` / `S$ 1500`. Editors enter digits
 * only. Without a known currency nothing is rendered: showing a bare
 * number is ambiguous, and guessing a symbol is how a Singapore profile
 * would end up priced in HK$.
 */
export function formatPrice(price: number | undefined, currency: CurrencyCode | undefined): string | null {
  if (typeof price !== "number" || !Number.isFinite(price) || price <= 0) return null;
  if (!currency) return null;
  return `${CURRENCY_SYMBOLS[currency]} ${Math.round(price)}`;
}
