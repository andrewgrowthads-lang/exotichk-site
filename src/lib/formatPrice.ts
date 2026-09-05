/** Formats a numeric HKD value as `HK$ 1500`. Editors enter digits only. */
export function formatHkd(price: number | undefined): string | null {
  if (typeof price !== "number" || !Number.isFinite(price) || price <= 0) return null;
  return `HK$ ${Math.round(price)}`;
}
