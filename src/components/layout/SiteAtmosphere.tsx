import Image from "next/image";
import { imageLqip, imageObjectPosition, urlFor } from "@/sanity/image";
import type { SanityImage } from "@/types/content";

const FALLBACK_HARBOUR = "/atmosphere/hong-kong-harbour-night.jpg";

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
          // Local fallback. The custom next/image loader only accepts cdn.sanity.io.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={FALLBACK_HARBOUR}
            alt=""
            fetchPriority={priority ? "high" : "low"}
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover object-[center_38%] saturate-125"
          />
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
