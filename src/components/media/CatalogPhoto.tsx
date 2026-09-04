import Image from "next/image";
import type { LocaleId } from "@/i18n/config";
import { pickLocalizedText } from "@/lib/localize";
import { imageLqip, imageObjectPosition, urlFor } from "@/sanity/image";
import type { SanityImage } from "@/types/content";

/**
 * The single place that turns a Sanity image field into a rendered
 * `<Image>`. Always uses `fill` + `object-cover` (the caller owns the
 * aspect-ratio box), so there is never a natural-dimensions mismatch to
 * reason about, and always applies the editor's hotspot as an
 * `object-position` so the focal point stays framed regardless of the
 * box's aspect ratio. See `sanity/image.ts` for why this doesn't try to
 * bake the crop into the requested URL itself.
 */
export function CatalogPhoto({
  photo,
  locale,
  fallbackAlt,
  priority = false,
  sizes,
  className,
}: {
  photo: SanityImage | undefined;
  locale: LocaleId;
  fallbackAlt: string;
  priority?: boolean;
  sizes?: string;
  className?: string;
}) {
  if (!photo?.asset) {
    return <div className={`bg-[#ddd8d0] ${className ?? ""}`} />;
  }

  const alt = pickLocalizedText(photo.alt, locale) || fallbackAlt;
  const lqip = imageLqip(photo);

  return (
    <Image
      src={urlFor(photo).url()}
      alt={alt}
      fill
      sizes={sizes ?? "(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"}
      placeholder={lqip ? "blur" : undefined}
      blurDataURL={lqip}
      priority={priority}
      className={className}
      style={{ objectPosition: imageObjectPosition(photo) }}
    />
  );
}
