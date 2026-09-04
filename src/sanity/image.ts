import { createImageUrlBuilder, type SanityImageSource } from "@sanity/image-url";
import { publicEnv } from "@/lib/publicEnv";

const builder = createImageUrlBuilder({
  projectId: publicEnv.sanityProjectId,
  dataset: publicEnv.sanityDataset,
});

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
  hotspot?: { x: number; y: number };
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

/**
 * CSS `object-position` for the editor-picked hotspot. We deliberately
 * don't bake a crop into the requested image URL itself: `next/image`
 * asks the Sanity CDN for several different widths for its responsive
 * `srcset`, and a URL-level crop would need a matching height (and
 * therefore a fixed aspect ratio) recomputed for every one of them. A
 * plain `object-position` on top of `object-cover` gets the same visual
 * result — the focal point stays framed regardless of the container's
 * aspect ratio — with zero extra Sanity requests or per-breakpoint math.
 */
export function imageObjectPosition(image: SanityImageAsset | undefined): string | undefined {
  const hotspot = image?.hotspot;
  if (!hotspot) return undefined;
  return `${Math.round(hotspot.x * 100)}% ${Math.round(hotspot.y * 100)}%`;
}

/** 1200x630 crop for Open Graph / social share previews. */
export function socialImageUrl(image: SanityImageAsset | undefined): string | undefined {
  if (!image?.asset) return undefined;
  return builder.image(image).width(1200).height(630).fit("crop").auto("format").url();
}

/** Plain resized URL, no forced aspect ratio — for things like the JSON-LD logo, which shouldn't be letterboxed to a 1200x630 crop. */
export function plainImageUrl(image: SanityImageAsset | undefined, width: number): string | undefined {
  if (!image?.asset) return undefined;
  return builder.image(image).width(width).auto("format").url();
}
