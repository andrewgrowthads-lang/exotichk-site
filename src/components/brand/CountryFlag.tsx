import { countryFlagSrc } from "@/lib/countryPresets";

/**
 * Country/region flag as a local SVG asset (not an OS emoji — Windows
 * renders flag emoji as two letters). Decorative: neighbouring text
 * already names the place. Renders nothing for a country without a
 * bundled flag.
 */
export function CountryFlag({ slug, className }: { slug: string | undefined; className?: string }) {
  const src = countryFlagSrc(slug);
  if (!src) return null;
  return (
    // Local SVG. The custom next/image loader only accepts cdn.sanity.io.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={24}
      height={16}
      className={`inline-block shrink-0 object-cover ${className ?? ""}`}
      draggable={false}
    />
  );
}
