import Link from "next/link";
import type { LocaleId } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { pickLocalizedText } from "@/lib/localize";
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

  return (
    <Link
      href={profilePath(profile.country.slug, profile.slug, locale)}
      className="group block"
    >
      <article className="overflow-hidden rounded-lg bg-[var(--surface)]">
        <div className="relative aspect-[3/4] overflow-hidden bg-[#ddd8d0]">
          <CatalogPhoto
            photo={profile.images?.[0]}
            locale={locale}
            fallbackAlt={profile.displayName}
            priority={priority}
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
            className="h-full w-full object-cover"
          />
          {profile.status === "temporarilyUnavailable" && (
            <span className="absolute top-2 left-2 rounded-full bg-black/55 px-2 py-0.5 text-[10px] tracking-wide text-white uppercase">
              {dictionary.profile.unavailableBadge}
            </span>
          )}
        </div>
        <div className="px-1.5 pt-2 pb-2.5 sm:px-2">
          <p className="truncate text-[15px] font-medium tracking-tight text-[var(--foreground)]">{profile.displayName}</p>
          {!hideDistrict && <p className="mt-0.5 truncate text-[12px] text-[var(--muted)]">{districtTitle}</p>}
        </div>
      </article>
    </Link>
  );
}
