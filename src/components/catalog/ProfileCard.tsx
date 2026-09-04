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
  const meta = [
    !hideDistrict ? districtTitle : null,
    profile.age ? String(profile.age) : null,
    profile.height ? `${profile.height} cm` : null,
  ].filter((value): value is string => Boolean(value));

  return (
    <Link href={profilePath(profile.country.slug, profile.slug, locale)} className="group block">
      <article className="relative overflow-hidden rounded-xl border border-white/10 bg-[var(--surface)] shadow-[0_12px_40px_rgba(0,0,0,0.35)] transition duration-300 group-hover:border-[var(--accent)]/45 group-hover:shadow-[0_16px_48px_rgba(255,45,138,0.16)]">
        <div className="relative aspect-[3/4] overflow-hidden bg-[var(--photo-fallback)]">
          <CatalogPhoto
            photo={profile.images?.[0]}
            locale={locale}
            fallbackAlt={profile.displayName}
            priority={priority}
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
          <div
            className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent px-2.5 pt-16 pb-2.5 sm:px-3 sm:pb-3"
            aria-hidden="true"
          />
          <div className="absolute inset-x-0 bottom-0 px-2.5 pb-2.5 sm:px-3 sm:pb-3">
            <p className="truncate text-[15px] font-medium tracking-tight text-white">{profile.displayName}</p>
            {meta.length > 0 && (
              <p className="mt-0.5 truncate text-[11px] tracking-wide text-white/70">{meta.join(" · ")}</p>
            )}
          </div>
          {profile.status === "temporarilyUnavailable" && (
            <span className="absolute top-2 left-2 rounded-md bg-black/65 px-2 py-0.5 text-[10px] tracking-wide text-white uppercase">
              {dictionary.profile.unavailableBadge}
            </span>
          )}
        </div>
      </article>
    </Link>
  );
}
