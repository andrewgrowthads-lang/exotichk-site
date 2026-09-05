import type { ReactNode } from "react";
import type { LocaleId } from "@/i18n/config";
import { CatalogPhoto } from "@/components/media/CatalogPhoto";
import { HongKongFlag } from "@/components/brand/HongKongFlag";
import { CatalogFrame } from "@/components/layout/CatalogFrame";
import type { SanityImage } from "@/types/content";

const FALLBACK_HARBOUR = "/atmosphere/hong-kong-harbour-night.jpg";

export function CatalogHero({
  locationTitle,
  tagline,
  contextLine,
  image,
  locale,
  locationAs = "p",
  contextAs = "p",
  showFlag = false,
  children,
}: {
  locationTitle: string;
  tagline?: string;
  contextLine?: string;
  image?: SanityImage;
  locale: LocaleId;
  locationAs?: "h1" | "p";
  contextAs?: "h1" | "p";
  showFlag?: boolean;
  children: ReactNode;
}) {
  const LocationTag = locationAs;
  const ContextTag = contextAs;
  const englishDisplay = locale === "en";
  const cmsImage = Boolean(image?.asset);

  return (
    <div className="relative isolate min-h-[36rem] sm:min-h-[42rem] lg:min-h-[52rem]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[40rem] overflow-hidden sm:h-[48rem] lg:h-[58rem]">
        {cmsImage ? (
          <div className="absolute inset-0">
            <CatalogPhoto
              photo={image}
              locale={locale}
              fallbackAlt=""
              sizes="100vw"
              className="h-full w-full object-cover object-[center_38%] saturate-125"
            />
          </div>
        ) : (
          // Local fallback. The custom next/image loader only accepts cdn.sanity.io.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={FALLBACK_HARBOUR}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-[center_38%] saturate-125"
          />
        )}
        <div className="catalog-skyline-overlay absolute inset-0" aria-hidden="true" />
      </div>

      <div className="relative z-10">
        <CatalogFrame className="pt-5 pb-0 sm:pt-7 lg:pt-8">
          <div className="flex items-center gap-2.5 sm:gap-3">
            {showFlag && (
              <HongKongFlag className="h-5 w-[30px] rounded-[3px] shadow-[0_0_18px_rgba(255,45,138,0.4)] ring-1 ring-[var(--accent)]/45 sm:h-6 sm:w-9" />
            )}
            <LocationTag
              className={`text-[28px] leading-none font-semibold text-white [text-shadow:0_2px_24px_rgba(0,0,0,0.85)] sm:text-[40px] lg:text-[48px] ${
                englishDisplay ? "tracking-[0.18em] uppercase" : "tracking-wide"
              }`}
            >
              {locationTitle}
            </LocationTag>
          </div>
          {contextLine ? (
            <ContextTag className="mt-2.5 text-[14px] font-medium tracking-wide text-white/88 [text-shadow:0_1px_12px_rgba(0,0,0,0.8)] sm:text-[16px]">
              {contextLine}
            </ContextTag>
          ) : tagline ? (
            <p className="mt-2.5 text-[12px] tracking-[0.18em] text-[var(--accent-soft)] uppercase [text-shadow:0_1px_12px_rgba(0,0,0,0.8)] sm:text-[13px]">
              {tagline}
              <span className="mt-1.5 block h-px w-14 bg-[var(--accent)] shadow-[0_0_12px_var(--accent)]" aria-hidden="true" />
            </p>
          ) : null}
          {!cmsImage && (
            <p className="mt-3 max-w-xl text-[10px] leading-snug text-white/25">
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
        </CatalogFrame>
        <CatalogFrame className="pt-4 pb-10 sm:pt-5">{children}</CatalogFrame>
      </div>
    </div>
  );
}
