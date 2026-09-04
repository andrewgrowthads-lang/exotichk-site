import type { LocaleId } from "@/i18n/config";
import { CatalogPhoto } from "@/components/media/CatalogPhoto";
import type { SanityImage } from "@/types/content";

function NightSkyline() {
  return (
    <svg
      viewBox="0 0 1200 220"
      preserveAspectRatio="xMidYMax slice"
      className="absolute inset-x-0 bottom-0 h-[78%] w-full"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="skyline-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#4a1a40" />
          <stop offset="55%" stopColor="#1a0a16" />
          <stop offset="100%" stopColor="#0a040c" />
        </linearGradient>
        <linearGradient id="skyline-water" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#ff2d8a" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#050308" stopOpacity="0" />
        </linearGradient>
        <filter id="skyline-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
      </defs>
      <ellipse cx="600" cy="168" rx="420" ry="28" fill="#ff2d8a" fillOpacity="0.18" filter="url(#skyline-glow)" />
      <rect x="0" y="168" width="1200" height="52" fill="url(#skyline-water)" />
      <g fill="url(#skyline-fill)">
        <rect x="40" y="108" width="28" height="60" />
        <rect x="76" y="78" width="36" height="90" />
        <rect x="120" y="98" width="22" height="70" />
        <rect x="168" y="52" width="42" height="116" />
        <rect x="218" y="88" width="30" height="80" />
        <rect x="270" y="38" width="24" height="130" />
        <rect x="302" y="68" width="48" height="100" />
        <rect x="360" y="92" width="26" height="76" />
        <rect x="420" y="28" width="38" height="140" />
        <rect x="466" y="70" width="22" height="98" />
        <rect x="510" y="48" width="56" height="120" />
        <rect x="578" y="86" width="32" height="82" />
        <rect x="640" y="22" width="30" height="146" />
        <rect x="678" y="60" width="44" height="108" />
        <rect x="732" y="96" width="20" height="72" />
        <rect x="780" y="44" width="50" height="124" />
        <rect x="840" y="74" width="28" height="94" />
        <rect x="888" y="34" width="36" height="134" />
        <rect x="932" y="82" width="40" height="86" />
        <rect x="990" y="58" width="24" height="110" />
        <rect x="1024" y="90" width="34" height="78" />
        <rect x="1074" y="46" width="46" height="122" />
        <rect x="1130" y="100" width="30" height="68" />
      </g>
      <g fill="#ff2d8a" fillOpacity="0.7">
        <rect x="174" y="64" width="2" height="3" />
        <rect x="186" y="80" width="2" height="3" />
        <rect x="278" y="52" width="2" height="3" />
        <rect x="428" y="44" width="2" height="3" />
        <rect x="442" y="62" width="2" height="3" />
        <rect x="526" y="60" width="2" height="3" />
        <rect x="650" y="36" width="2" height="4" />
        <rect x="662" y="52" width="2" height="3" />
        <rect x="796" y="58" width="2" height="3" />
        <rect x="900" y="48" width="2" height="3" />
        <rect x="1088" y="60" width="2" height="3" />
      </g>
    </svg>
  );
}

export function CatalogHero({
  title,
  subtitle,
  image,
  locale,
  titleAs = "h1",
}: {
  title: string;
  subtitle?: string;
  image?: SanityImage;
  locale: LocaleId;
  titleAs?: "h1" | "p";
}) {
  const TitleTag = titleAs;
  const englishDisplay = locale === "en";

  return (
    <div className="relative -mx-3 -mt-3 overflow-hidden sm:-mx-4 sm:-mt-4">
      <div className="relative flex min-h-[9.5rem] items-end sm:min-h-[11.5rem]">
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,45,138,0.16),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(88,20,90,0.35),transparent_50%)]"
          aria-hidden="true"
        />
        {image?.asset ? (
          <div className="absolute inset-0">
            <CatalogPhoto
              photo={image}
              locale={locale}
              fallbackAlt=""
              sizes="100vw"
              className="h-full w-full object-cover opacity-45 saturate-75"
            />
          </div>
        ) : (
          <NightSkyline />
        )}
        <div
          className="absolute inset-0 bg-[linear-gradient(to_top,var(--background)_0%,rgba(5,3,8,0.55)_42%,rgba(5,3,8,0.2)_100%)]"
          aria-hidden="true"
        />
        <div className="relative z-10 w-full px-3 pb-5 sm:px-4 sm:pb-6">
          <TitleTag
            className={`text-[28px] leading-none font-semibold text-white sm:text-[40px] ${
              englishDisplay ? "tracking-[0.18em] uppercase" : "tracking-wide"
            }`}
          >
            {title}
          </TitleTag>
          {subtitle && (
            <p className="mt-2 text-[13px] tracking-[0.16em] text-[var(--accent-soft)] uppercase">
              {subtitle}
              <span
                className="mt-1.5 block h-px w-16 bg-[var(--accent)]"
                aria-hidden="true"
              />
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
