import Image from "next/image";
import { imageLqip, imageObjectPosition, urlFor } from "@/sanity/image";
import type { SanityImage } from "@/types/content";

/**
 * Local fallback photo, pre-encoded at build-input time (see
 * `public/atmosphere/`) instead of served through `next/image`: the custom
 * loader only accepts cdn.sanity.io, and the asset never changes, so a
 * static AVIF/WebP/JPEG set is the cheapest correct delivery.
 *
 * Landscape widths cover desktop and tablets. Portrait phones get a
 * dedicated centre crop: `object-fit: cover` on a tall viewport only ever
 * shows the middle ~30% of the 1920px frame, so shipping the full width
 * spent ~90% of the bytes on pixels that were cropped off. The crop is
 * the same centre column the browser would have displayed, so the visual
 * result is unchanged.
 */
const FALLBACK_BASE = "/atmosphere/hong-kong-harbour-night";
const FALLBACK_LANDSCAPE_WIDTHS = [1024, 1280, 1600, 1920] as const;
/** Portrait phone crop: 564×908, i.e. the aspect a ≤640px-wide portrait viewport can show. */
const FALLBACK_PORTRAIT_MEDIA = "(orientation: portrait) and (max-width: 640px)";
/** Portrait tablets keep the landscape frame; ask for ~2× width so cover-by-height stays as sharp as before. */
const FALLBACK_LANDSCAPE_SIZES = "(orientation: portrait) 200vw, 100vw";

function landscapeSrcSet(ext: "avif" | "webp" | "jpg"): string {
  return FALLBACK_LANDSCAPE_WIDTHS.map((width) => `${FALLBACK_BASE}-${width}.${ext} ${width}w`).join(", ");
}

export type AtmosphereIntensity = "catalog" | "profile";

/**
 * Site-wide Hong Kong night layer. Rendered once from PageShell so
 * catalogue, district, and profile pages share the same visual
 * environment instead of each painting (or omitting) their own skyline.
 *
 * The photo is `position: fixed` + `object-fit: cover`: it fills the
 * viewport without stretching, stays present while scrolling, and never
 * downloads twice on one page. Overlay darkness/tint lives in CSS.
 */
export function SiteAtmosphere({
  image,
  intensity = "catalog",
}: {
  image?: SanityImage;
  intensity?: AtmosphereIntensity;
}) {
  const cmsImage = Boolean(image?.asset);
  const priority = intensity === "catalog";
  const objectPosition = imageObjectPosition(image) ?? "center 38%";
  const lqip = imageLqip(image);

  return (
    <div className={`site-atmosphere site-atmosphere--${intensity}`}>
      <div className="absolute inset-0" aria-hidden="true">
        {cmsImage && image ? (
          <Image
            src={urlFor(image).url()}
            alt=""
            fill
            sizes="100vw"
            placeholder={lqip ? "blur" : undefined}
            blurDataURL={lqip}
            priority={priority}
            className="object-cover saturate-125"
            style={{ objectPosition }}
          />
        ) : (
          // Local fallback (static responsive set — see FALLBACK_BASE above).
          // Wrapped in <picture> so React does not auto-preload it: the first
          // profile card is the LCP element and must stay the only high-priority image.
          <picture>
            <source media={FALLBACK_PORTRAIT_MEDIA} type="image/avif" srcSet={`${FALLBACK_BASE}-portrait.avif`} />
            <source media={FALLBACK_PORTRAIT_MEDIA} type="image/webp" srcSet={`${FALLBACK_BASE}-portrait.webp`} />
            <source media={FALLBACK_PORTRAIT_MEDIA} srcSet={`${FALLBACK_BASE}-portrait.jpg`} />
            <source type="image/avif" srcSet={landscapeSrcSet("avif")} sizes={FALLBACK_LANDSCAPE_SIZES} />
            <source type="image/webp" srcSet={landscapeSrcSet("webp")} sizes={FALLBACK_LANDSCAPE_SIZES} />
            <img
              src={`${FALLBACK_BASE}-1920.jpg`}
              srcSet={landscapeSrcSet("jpg")}
              sizes={FALLBACK_LANDSCAPE_SIZES}
              alt=""
              fetchPriority={priority ? "auto" : "low"}
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover object-[center_38%] saturate-125"
            />
          </picture>
        )}
        <div className="site-atmosphere__overlay" />
      </div>
      {!cmsImage && (
        <p className="site-atmosphere__credit pointer-events-auto z-[1] max-w-[16rem] text-[10px] leading-snug text-white/25">
          Photo: Benh LIEU SONG /{" "}
          <a
            href="https://creativecommons.org/licenses/by-sa/4.0/"
            rel="license noopener noreferrer"
            className="underline-offset-2 hover:text-white/50 hover:underline"
          >
            CC BY-SA 4.0
          </a>
        </p>
      )}
    </div>
  );
}
