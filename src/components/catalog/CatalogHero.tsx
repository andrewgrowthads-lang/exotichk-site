import type { LocaleId } from "@/i18n/config";
import { CatalogPhoto } from "@/components/media/CatalogPhoto";
import { HongKongFlag } from "@/components/brand/HongKongFlag";
import { CatalogFrame } from "@/components/layout/CatalogFrame";
import type { SanityImage } from "@/types/content";

const FALLBACK_HARBOUR = "/atmosphere/hong-kong-harbour-night.jpg";

export function CatalogHero({
  title,
  subtitle,
  image,
  locale,
  titleAs = "h1",
  showFlag = false,
}: {
  title: string;
  subtitle?: string;
  image?: SanityImage;
  locale: LocaleId;
  titleAs?: "h1" | "p";
  showFlag?: boolean;
}) {
  const TitleTag = titleAs;
  const englishDisplay = locale === "en";
  const cmsImage = Boolean(image?.asset);

  return (
    <div className="relative overflow-hidden">
      <div className="relative flex h-[13.75rem] items-end sm:h-[18rem] md:h-[28rem] lg:h-[34rem]">
        {cmsImage ? (
          <div className="absolute inset-0">
            <CatalogPhoto
              photo={image}
              locale={locale}
              fallbackAlt=""
              sizes="100vw"
              className="h-full w-full object-cover object-[center_42%] saturate-125"
            />
          </div>
        ) : (
          // Local fallback. The custom next/image loader only accepts cdn.sanity.io.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={FALLBACK_HARBOUR}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-[center_42%] saturate-125"
          />
        )}
        <div
          className="absolute inset-0 bg-[linear-gradient(to_top,var(--background)_0%,rgba(5,3,8,0.88)_24%,rgba(18,6,22,0.72)_58%,rgba(10,3,14,0.58)_100%),linear-gradient(rgba(92,12,70,0.28),rgba(92,12,70,0.18))]"
          aria-hidden="true"
        />
        <CatalogFrame className="relative z-10 pb-5 sm:pb-7 lg:pb-8">
          <div className="flex items-center gap-2.5 sm:gap-3">
            {showFlag && (
              <HongKongFlag className="h-5 w-[30px] rounded-[3px] shadow-[0_0_16px_rgba(255,45,138,0.35)] ring-1 ring-[var(--accent)]/40 sm:h-6 sm:w-9" />
            )}
            <TitleTag
              className={`text-[28px] leading-none font-semibold text-white [text-shadow:0_2px_24px_rgba(0,0,0,0.85)] sm:text-[40px] lg:text-[48px] ${
                englishDisplay ? "tracking-[0.18em] uppercase" : "tracking-wide"
              }`}
            >
              {title}
            </TitleTag>
          </div>
          {subtitle && (
            <p className="mt-2.5 ml-0 text-[12px] tracking-[0.18em] text-[var(--accent-soft)] uppercase [text-shadow:0_1px_12px_rgba(0,0,0,0.8)] sm:text-[13px]">
              {subtitle}
              <span className="mt-1.5 block h-px w-14 bg-[var(--accent)]" aria-hidden="true" />
            </p>
          )}
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
      </div>
    </div>
  );
}
