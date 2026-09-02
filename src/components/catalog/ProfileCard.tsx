import Link from "next/link";
import type { LocaleId } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { pickLocalizedText } from "@/lib/localize";
import { profilePath } from "@/lib/urls";
import { SanityImg } from "@/components/media/SanityImg";
import type { ProfileSummary } from "@/types/content";

export function ProfileCard({
  profile,
  locale,
  dictionary,
}: {
  profile: ProfileSummary;
  locale: LocaleId;
  dictionary: Dictionary;
}) {
  const districtTitle = pickLocalizedText(profile.district.title, locale);
  return (
    <Link
      href={profilePath(profile.country.slug, profile.slug, locale)}
      className="group block overflow-hidden rounded-xl border border-neutral-200 transition hover:border-neutral-300 dark:border-neutral-800 dark:hover:border-neutral-700"
    >
      <div className="aspect-[3/4] overflow-hidden bg-neutral-100 dark:bg-neutral-900">
        <SanityImg
          image={profile.images?.[0]}
          locale={locale}
          fallbackAlt={profile.displayName}
          sizes="(min-width: 768px) 25vw, 50vw"
          className="h-full w-full object-cover transition group-hover:scale-105"
        />
      </div>
      <div className="p-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-neutral-900 dark:text-neutral-50">{profile.displayName}</h3>
          {profile.status === "temporarilyUnavailable" && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
              {dictionary.profile.unavailableBadge}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">{districtTitle}</p>
      </div>
    </Link>
  );
}
