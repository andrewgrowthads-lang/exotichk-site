import Image from "next/image";
import { LocalPhoto, PhotoCredit } from "@/components/media/LocalPhoto";
import { countryPhoto } from "@/lib/countryPresets";
import { imageLqip, imageObjectPosition, urlFor } from "@/sanity/image";
import type { SanityImage } from "@/types/content";

/** Portrait tablets keep the landscape frame; ask for ~2× width so cover-by-height stays sharp. */
const LANDSCAPE_SIZES = "(orientation: portrait) 200vw, 100vw";

export type AtmosphereIntensity = "catalog" | "profile";

/**
 * Site-wide city night layer. Rendered once from PageShell so catalogue,
 * district, and profile pages share the same visual environment instead
 * of each painting (or omitting) their own skyline.
 *
 * Source, in order: the country's background image from Sanity, the
 * bundled photo for that country's slug, then no photo at all (the
 * neutral purple/pink wash from `body::before` and the overlay below).
 * A country never borrows another country's skyline.
 *
 * The photo is `position: fixed` + `object-fit: cover`: it fills the
 * viewport without stretching, stays present while scrolling, and never
 * downloads twice on one page. Overlay darkness/tint lives in CSS.
 */
export function SiteAtmosphere({
  image,
  countrySlug,
  intensity = "catalog",
}: {
  image?: SanityImage;
  countrySlug?: string;
  intensity?: AtmosphereIntensity;
}) {
  const cmsImage = image?.asset ? image : undefined;
  const fallback = cmsImage ? undefined : countryPhoto(countrySlug);
  const priority = intensity === "catalog";
  const lqip = imageLqip(cmsImage);

  return (
    <div className={`site-atmosphere site-atmosphere--${intensity}`}>
      <div className="absolute inset-0" aria-hidden="true">
        {cmsImage ? (
          <Image
            src={urlFor(cmsImage).url()}
            alt=""
            fill
            sizes="100vw"
            placeholder={lqip ? "blur" : undefined}
            blurDataURL={lqip}
            priority={priority}
            className="object-cover saturate-125"
            style={{ objectPosition: imageObjectPosition(cmsImage) ?? "center 38%" }}
          />
        ) : fallback ? (
          // The first profile card is the LCP element and must stay the only high-priority image.
          <LocalPhoto
            photo={fallback}
            sizes={LANDSCAPE_SIZES}
            portraitCrop
            fetchPriority={priority ? "auto" : "low"}
            className="absolute inset-0 h-full w-full object-cover saturate-125"
          />
        ) : null}
        <div className="site-atmosphere__overlay" />
      </div>
      {fallback && (
        <PhotoCredit
          photos={[fallback]}
          className="site-atmosphere__credit pointer-events-auto z-[1] max-w-[16rem] text-[10px] leading-snug text-white/25"
        />
      )}
    </div>
  );
}
