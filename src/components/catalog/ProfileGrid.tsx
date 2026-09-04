import type { LocaleId } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { ProfileCard } from "@/components/catalog/ProfileCard";
import type { ProfileSummary } from "@/types/content";

export function ProfileGrid({
  profiles,
  locale,
  dictionary,
  hideDistrict = false,
  priorityFirst = false,
}: {
  profiles: ProfileSummary[];
  locale: LocaleId;
  dictionary: Dictionary;
  hideDistrict?: boolean;
  /**
   * Only true on pages where this grid's first card is the actual LCP
   * candidate (home/country/district listings). Profile pages already
   * have their own hero image as the LCP, so their "similar profiles"
   * grid must never opt a second image into `priority`.
   */
  priorityFirst?: boolean;
}) {
  // Country and district listings render this grid unconditionally, so the
  // "nothing to show" case belongs here rather than at each call site.
  // `ProfileView` still gates on length because that section has its own
  // heading to suppress as well.
  if (profiles.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-10 text-center">
        <p className="text-[14px] text-[var(--foreground)]">{dictionary.listing.empty}</p>
        <p className="mt-1 text-[13px] text-[var(--muted)]">{dictionary.listing.emptyHint}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-4">
      {profiles.map((profile, index) => (
        <ProfileCard
          key={profile._id}
          profile={profile}
          locale={locale}
          dictionary={dictionary}
          priority={priorityFirst && index === 0}
          hideDistrict={hideDistrict}
        />
      ))}
    </div>
  );
}
