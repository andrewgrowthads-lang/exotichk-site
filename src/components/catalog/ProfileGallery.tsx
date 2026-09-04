"use client";

import { useEffect, useRef, useState } from "react";
import type { LocaleId } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { CatalogPhoto } from "@/components/media/CatalogPhoto";
import type { SanityImage } from "@/types/content";

/**
 * Mobile swipe strip + fullscreen viewer for a profile's photos.
 *
 * Both the strip and the fullscreen overlay reuse the same CSS
 * scroll-snap technique for swiping — no gesture/carousel library. The
 * fullscreen photos aren't rendered into the DOM until the overlay is
 * actually opened, so opening it never triggers extra requests upfront;
 * closing it lazily lets the browser drop images that scroll far
 * offscreen the same way the inline strip does.
 */
export function ProfileGallery({
  photos,
  locale,
  displayName,
  dictionary,
}: {
  photos: SanityImage[];
  locale: LocaleId;
  displayName: string;
  dictionary: Dictionary;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const overlayStripRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (openIndex === null) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenIndex(null);
    };
    window.addEventListener("keydown", onKeyDown);

    const strip = overlayStripRef.current;
    const slide = strip?.children[openIndex] as HTMLElement | undefined;
    slide?.scrollIntoView({ behavior: "instant" as ScrollBehavior, inline: "center" });

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [openIndex]);

  return (
    <div>
      <div className="hide-scrollbar -mx-3 flex snap-x snap-mandatory overflow-x-auto sm:mx-0 md:overflow-visible">
        {photos.map((photo, index) => (
          <button
            key={photo.asset?._ref ?? index}
            type="button"
            onClick={() => setOpenIndex(index)}
            aria-label={`${dictionary.gallery.openPhoto} ${index + 1}/${photos.length}`}
            className={`block w-[min(100%,100vw)] shrink-0 snap-center overflow-hidden bg-[var(--photo-fallback)] md:w-full md:rounded-xl md:border md:border-white/10 ${
              index > 0 ? "md:hidden" : ""
            }`}
          >
            <div className={`relative ${index === 0 ? "aspect-[3/4] md:aspect-[4/5]" : "aspect-[3/4]"}`}>
              <CatalogPhoto
                photo={photo}
                locale={locale}
                fallbackAlt={displayName}
                priority={index === 0}
                sizes={index === 0 ? "(min-width: 768px) 45vw, 100vw" : "(min-width: 768px) 35vw, 100vw"}
                className="h-full w-full object-cover"
              />
            </div>
          </button>
        ))}
      </div>

      {photos.length > 1 && (
        <div className="mt-2 flex justify-center gap-1.5 md:hidden" aria-hidden="true">
          {photos.map((photo, index) => (
            <span
              key={`dot-${photo.asset?._ref ?? index}`}
              className={`h-1.5 w-1.5 rounded-full ${index === 0 ? "bg-[var(--accent)]" : "bg-[var(--line)]"}`}
            />
          ))}
        </div>
      )}

      {photos.length > 1 && (
        <div className="mt-2 hidden grid-cols-4 gap-2 md:grid">
          {photos.slice(0, 4).map((photo, index) => (
            <button
              key={`thumb-${photo.asset?._ref ?? index}`}
              type="button"
              onClick={() => setOpenIndex(index)}
              aria-label={`${dictionary.gallery.openPhoto} ${index + 1}/${photos.length}`}
              className="relative aspect-square overflow-hidden rounded-lg bg-[var(--photo-fallback)] ring-1 ring-white/10"
            >
              <CatalogPhoto
                photo={photo}
                locale={locale}
                fallbackAlt={displayName}
                sizes="10vw"
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {openIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black" role="dialog" aria-modal="true" aria-label={displayName}>
          <button
            type="button"
            onClick={() => setOpenIndex(null)}
            aria-label={dictionary.gallery.close}
            // The overlay is `fixed`, so it sits outside the safe-area padding
            // `body` carries. Under `viewportFit: "cover"` that would put the
            // only way out of the fullscreen viewer behind the notch in
            // landscape.
            className="absolute top-3 right-[max(0.75rem,env(safe-area-inset-right))] z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-2xl leading-none text-white"
          >
            ×
          </button>
          <div ref={overlayStripRef} className="hide-scrollbar flex h-full snap-x snap-mandatory overflow-x-auto">
            {photos.map((photo, index) => (
              <div key={`full-${photo.asset?._ref ?? index}`} className="relative h-full w-full shrink-0 snap-center">
                <CatalogPhoto
                  photo={photo}
                  locale={locale}
                  fallbackAlt={displayName}
                  sizes="100vw"
                  className="object-contain"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
