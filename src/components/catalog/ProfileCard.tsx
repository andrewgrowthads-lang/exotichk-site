import Link from "next/link";
import type { LocaleId } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { localizeNationality, pickLocalizedText } from "@/lib/localize";
import { profilePath } from "@/lib/urls";
import { CatalogPhoto } from "@/components/media/CatalogPhoto";
import type { ProfileSummary } from "@/types/content";

export function ProfileCard({
  profile,
  locale,
  dictionary,
  priority = false,
  hideDistrict = false,
}: {
  profile: ProfileSummary;
  locale: LocaleId;
  dictionary: Dictionary;
  priority?: boolean;
  hideDistrict?: boolean;
}) {
  const districtTitle = pickLocalizedText(profile.district.title, locale);
  const nationality = profile.nationality ? localizeNationality(profile.nationality, locale) : null;
  const meta = [
    !hideDistrict ? districtTitle : null,
    profile.age ? String(profile.age) : null,
    profile.height ? `${profile.height} cm` : null,
  ].filter((value): value is string => Boolean(value));

  return (
    <Link href={profilePath(profile.country.slug, profile.slug, locale)} className="group block">
      <article className="relative overflow-hidden rounded-xl border border-white/10 bg-[var(--surface)] shadow-[0_14px_40px_rgba(0,0,0,0.4)] transition duration-300 group-hover:border-[var(--accent)]/50 group-hover:shadow-[0_12px_36px_rgba(255,45,138,0.14)]">
        <div className="relative aspect-[3/4] overflow-hidden bg-[var(--photo-fallback)]">
          <CatalogPhoto
            photo={profile.images?.[0]}
            locale={locale}
            fallbackAlt={profile.displayName}
            priority={priority}
            sizes="(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 50vw"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.025]"
          />
          <div
            className="absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-black via-black/75 to-transparent"
            aria-hidden="true"
          />
          <div className="absolute inset-x-0 bottom-0 px-2.5 pb-2.5 sm:px-3 sm:pb-3">
            <p className="truncate text-[15px] font-medium tracking-tight text-white drop-shadow-sm sm:text-[16px]">
              {profile.displayName}
            </p>
            {nationality && (
              <p className="mt-0.5 truncate text-[11px] tracking-wide text-white/75">{nationality}</p>
            )}
            {meta.length > 0 && (
              <p className="mt-0.5 truncate text-[11px] tracking-wide text-white/80">{meta.join(" • ")}</p>
            )}
          </div>
          {profile.status === "temporarilyUnavailable" && (
            <span className="absolute top-2 left-2 rounded-md bg-black/70 px-2 py-0.5 text-[10px] tracking-wide text-white uppercase">
              {dictionary.profile.unavailableBadge}
            </span>
          )}
        </div>
      </article>
    </Link>
  );
}
