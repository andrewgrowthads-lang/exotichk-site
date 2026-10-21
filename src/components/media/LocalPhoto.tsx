import type { CSSProperties } from "react";
import type { AtmospherePhoto } from "@/lib/countryPresets";

/**
 * A bundled photo from `public/atmosphere/`, pre-encoded at build-input
 * time instead of served through `next/image`: the custom loader only
 * accepts cdn.sanity.io, and the assets never change, so a static
 * AVIF/WebP/JPEG set is the cheapest correct delivery.
 *
 * Wrapped in <picture> so React does not auto-preload it.
 */
const LANDSCAPE_WIDTHS = [1024, 1280, 1600, 1920] as const;
/** Portrait phone crop: 564×908, i.e. the aspect a ≤640px-wide portrait viewport can show. */
const PORTRAIT_MEDIA = "(orientation: portrait) and (max-width: 640px)";

function landscapeSrcSet(base: string, ext: "avif" | "webp" | "jpg"): string {
  return LANDSCAPE_WIDTHS.map((width) => `${base}-${width}.${ext} ${width}w`).join(", ");
}

export function LocalPhoto({
  photo,
  sizes,
  portraitCrop = false,
  fetchPriority = "auto",
  lazy = false,
  className,
  style,
}: {
  photo: AtmospherePhoto;
  sizes: string;
  /**
   * Full-viewport backdrops only. `object-fit: cover` on a tall viewport
   * shows only the middle ~30% of the 1920px frame, so portrait phones get
   * the matching centre crop instead of the full width.
   */
  portraitCrop?: boolean;
  fetchPriority?: "high" | "low" | "auto";
  lazy?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const { base } = photo;
  return (
    <picture>
      {portraitCrop && (
        <>
          <source media={PORTRAIT_MEDIA} type="image/avif" srcSet={`${base}-portrait.avif`} />
          <source media={PORTRAIT_MEDIA} type="image/webp" srcSet={`${base}-portrait.webp`} />
          <source media={PORTRAIT_MEDIA} srcSet={`${base}-portrait.jpg`} />
        </>
      )}
      <source type="image/avif" srcSet={landscapeSrcSet(base, "avif")} sizes={sizes} />
      <source type="image/webp" srcSet={landscapeSrcSet(base, "webp")} sizes={sizes} />
      <img
        src={`${base}-1920.jpg`}
        srcSet={landscapeSrcSet(base, "jpg")}
        sizes={sizes}
        alt=""
        fetchPriority={fetchPriority}
        loading={lazy ? "lazy" : undefined}
        decoding="async"
        className={className}
        style={{ objectPosition: photo.objectPosition, ...style }}
      />
    </picture>
  );
}

export function PhotoCredit({ photos, className }: { photos: AtmospherePhoto[]; className?: string }) {
  const authors = [...new Set(photos.map((photo) => photo.credit.author))];
  const licenses = [...new Map(photos.map((photo) => [photo.credit.license, photo.credit.licenseUrl])).entries()];
  if (authors.length === 0) return null;
  return (
    <p className={className}>
      {authors.length > 1 ? "Photos" : "Photo"}: {authors.join(", ")} /{" "}
      {licenses.map(([license, url], index) => (
        <span key={license}>
          {index > 0 && ", "}
          <a href={url} rel="license noopener noreferrer" className="underline-offset-2 hover:text-white/50 hover:underline">
            {license}
          </a>
        </span>
      ))}
    </p>
  );
}
