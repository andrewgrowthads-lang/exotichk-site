import Image from "next/image";
import type { LocaleId } from "@/i18n/config";
import { pickLocalizedText } from "@/lib/localize";
import { imageDimensions, imageLqip, urlFor } from "@/sanity/image";
import type { SanityImage as SanityImageValue } from "@/types/content";

interface SanityImgProps {
  image: SanityImageValue | undefined;
  locale: LocaleId;
  /** Fallback alt text if the image has no localized alt for this locale. */
  fallbackAlt: string;
  priority?: boolean;
  sizes?: string;
  className?: string;
}

/**
 * The single place that turns a Sanity image field into a rendered
 * `<Image>`. Always requests a sized transform from the Sanity CDN
 * (via `images.loader: "custom"` in next.config.ts) and always declares
 * intrinsic dimensions, so no catalog image can introduce layout shift.
 */
export function SanityImg({ image, locale, fallbackAlt, priority, sizes, className }: SanityImgProps) {
  if (!image?.asset) return null;

  const dimensions = imageDimensions(image);
  if (!dimensions) return null;

  const alt = pickLocalizedText(image.alt, locale) || fallbackAlt;
  const src = urlFor(image).url();

  return (
    <Image
      src={src}
      alt={alt}
      width={dimensions.width}
      height={dimensions.height}
      sizes={sizes ?? "(min-width: 768px) 33vw, 100vw"}
      placeholder={imageLqip(image) ? "blur" : undefined}
      blurDataURL={imageLqip(image)}
      priority={priority}
      className={className}
    />
  );
}
