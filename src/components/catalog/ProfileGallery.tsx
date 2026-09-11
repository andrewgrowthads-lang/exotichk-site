"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import type { LocaleId } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { CatalogPhoto } from "@/components/media/CatalogPhoto";
import type { SanityImage } from "@/types/content";

/**
 * Swipeable photo strip + fullscreen viewer for a profile's photos.
 *
 * The strip, the overlay and the prev/next arrows all drive the same CSS
 * scroll-snap track — no gesture/carousel library. Arrows call
 * `scrollTo` on the track (wrapping at both ends), and the track's own
 * scroll position is the single source of truth for which photo is
 * "current", so a finger swipe on mobile and an arrow click on desktop
 * keep the counter, the dots and the thumbnails in sync. The fullscreen
 * photos aren't rendered into the DOM until the overlay is opened, so
 * opening it never triggers extra requests upfront.
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
  const [current, setCurrent] = useState(0);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const overlayStripRef = useRef<HTMLDivElement>(null);
  const scrollFrame = useRef<number | null>(null);
  const count = photos.length;
  const multiple = count > 1;

  /** Cyclic: past the last photo wraps to the first and vice versa. */
  const goTo = useCallback(
    (index: number) => {
      if (count === 0) return;
      const next = ((index % count) + count) % count;
      setCurrent(next);
      const strip = stripRef.current;
      if (strip) strip.scrollTo({ left: next * strip.clientWidth, behavior: "smooth" });
    },
    [count],
  );

  // Derive `current` from where the snap track actually settled, so swipes
  // (which never go through `goTo`) update the counter too.
  const onStripScroll = () => {
    if (scrollFrame.current !== null) return;
    scrollFrame.current = window.requestAnimationFrame(() => {
      scrollFrame.current = null;
      const strip = stripRef.current;
      if (!strip || strip.clientWidth === 0) return;
      const index = Math.round(strip.scrollLeft / strip.clientWidth);
      const clamped = Math.min(Math.max(index, 0), count - 1);
      setCurrent((previous) => (previous === clamped ? previous : clamped));
    });
  };

  useEffect(() => {
    return () => {
      if (scrollFrame.current !== null) window.cancelAnimationFrame(scrollFrame.current);
    };
  }, []);

  // Left/Right arrow keys work while focus is anywhere inside the gallery
  // (the arrow buttons, the photo, a thumbnail), not globally on the page.
  const onGalleryKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!multiple || openIndex !== null) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goTo(current - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      goTo(current + 1);
    }
  };

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

  const arrowClass =
    "absolute top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/45 text-white opacity-70 shadow-[0_2px_12px_rgba(0,0,0,0.45)] backdrop-blur-[3px] transition-[opacity,border-color,box-shadow,background-color] duration-200 hover:border-[var(--accent)] hover:bg-black/60 hover:opacity-100 hover:shadow-[0_0_18px_rgba(255,45,138,0.6),0_0_2px_var(--accent)] focus-visible:border-[var(--accent)] focus-visible:opacity-100 focus-visible:shadow-[0_0_18px_rgba(255,45,138,0.6),0_0_2px_var(--accent)] focus-visible:outline-none active:scale-95";

  return (
    <div onKeyDown={onGalleryKeyDown}>
      <div className="relative -mx-3 sm:mx-0 md:overflow-hidden md:rounded-xl md:border md:border-white/10">
        <div
          ref={stripRef}
          onScroll={onStripScroll}
          className="hide-scrollbar flex snap-x snap-mandatory overflow-x-auto"
        >
          {photos.map((photo, index) => (
            <button
              key={photo.asset?._ref ?? index}
              type="button"
              onClick={() => setOpenIndex(index)}
              aria-label={`${dictionary.gallery.openPhoto} ${index + 1}/${count}`}
              className="block w-full shrink-0 snap-center overflow-hidden bg-[var(--photo-fallback)]"
            >
              <div className="relative aspect-[3/4] md:aspect-[4/5]">
                <CatalogPhoto
                  photo={photo}
                  locale={locale}
                  fallbackAlt={displayName}
                  priority={index === 0}
                  sizes="(min-width: 768px) 45vw, 100vw"
                  className="h-full w-full object-cover"
                />
              </div>
            </button>
          ))}
        </div>

        {multiple && (
          <>
            <button
              type="button"
              onClick={() => goTo(current - 1)}
              aria-label={dictionary.gallery.previous}
              className={`${arrowClass} left-2 sm:left-3`}
            >
              <ChevronIcon direction="left" />
            </button>
            <button
              type="button"
              onClick={() => goTo(current + 1)}
              aria-label={dictionary.gallery.next}
              className={`${arrowClass} right-2 sm:right-3`}
            >
              <ChevronIcon direction="right" />
            </button>
            <div
              aria-live="polite"
              className="pointer-events-none absolute right-2 bottom-2 rounded-md bg-black/55 px-2 py-0.5 text-[11px] font-medium tracking-[0.08em] text-white/85 tabular-nums backdrop-blur-[3px] sm:right-3 sm:bottom-3"
            >
              {current + 1} / {count}
            </div>
          </>
        )}
      </div>

      {multiple && (
        <div className="mt-2 flex justify-center gap-1.5 md:hidden" aria-hidden="true">
          {photos.map((photo, index) => (
            <span
              key={`dot-${photo.asset?._ref ?? index}`}
              className={`h-1.5 w-1.5 rounded-full transition-colors duration-200 ${
                index === current ? "bg-[var(--accent)]" : "bg-[var(--line)]"
              }`}
            />
          ))}
        </div>
      )}

      {multiple && (
        <div className="mt-2 hidden grid-cols-4 gap-2 md:grid">
          {photos.slice(0, 4).map((photo, index) => (
            <button
              key={`thumb-${photo.asset?._ref ?? index}`}
              type="button"
              onClick={() => goTo(index)}
              aria-label={`${dictionary.gallery.openPhoto} ${index + 1}/${count}`}
              aria-current={index === current ? "true" : undefined}
              className={`relative aspect-square overflow-hidden rounded-lg bg-[var(--photo-fallback)] transition-[box-shadow,opacity] duration-200 ${
                index === current
                  ? "ring-1 ring-[var(--accent)] shadow-[0_0_14px_rgba(255,45,138,0.4)]"
                  : "ring-1 ring-white/10 opacity-80 hover:opacity-100 hover:ring-[var(--accent)]/60"
              }`}
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

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={direction === "left" ? "-translate-x-px" : "translate-x-px"}
    >
      {direction === "left" ? <path d="M15 5l-7 7 7 7" /> : <path d="M9 5l7 7-7 7" />}
    </svg>
  );
}
