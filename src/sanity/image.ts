import imageUrlBuilder, { type SanityImageSource } from "@sanity/image-url";
import { sanityClient } from "@/sanity/client";

const builder = imageUrlBuilder(sanityClient);

/** Base Sanity CDN URL for an image asset, with auto-format enabled. */
export function urlFor(source: SanityImageSource) {
  return builder.image(source).auto("format");
}

export interface SanityImageAsset {
  asset?: {
    _ref?: string;
    metadata?: {
      dimensions?: { width: number; height: number };
      lqip?: string;
    };
  };
  hotspot?: unknown;
  crop?: unknown;
}

/**
 * Intrinsic width/height decoded from the asset's own metadata, so every
 * `<Image>` can declare dimensions up front and avoid layout shift
 * without an extra network round trip.
 */
export function imageDimensions(image: SanityImageAsset | undefined): { width: number; height: number } | null {
  const dimensions = image?.asset?.metadata?.dimensions;
  if (!dimensions) return null;
  return { width: dimensions.width, height: dimensions.height };
}

export function imageLqip(image: SanityImageAsset | undefined): string | undefined {
  return image?.asset?.metadata?.lqip;
}
