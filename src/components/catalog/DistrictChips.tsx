import Link from "next/link";
import type { LocaleId } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { districtNavLabel } from "@/lib/districtLabels";
import { pickLocalizedText } from "@/lib/localize";
import { districtPath, homePath } from "@/lib/urls";
import type { DistrictDetail } from "@/types/content";

export function DistrictChips({
  countrySlug,
  districts,
  locale,
  dictionary,
  active,
  allHref,
}: {
  countrySlug: string;
  districts: DistrictDetail[];
  locale: LocaleId;
  dictionary: Dictionary;
  active?: string;
  allHref?: string;
}) {
  const allActive = !active;
  const chip = (isActive: boolean) =>
    `flex shrink-0 items-center rounded-md px-3.5 text-[12px] font-medium tracking-[0.12em] uppercase min-h-10 transition-[color,background-color,border-color,box-shadow] duration-200 ${
      isActive
        ? "bg-[var(--accent)] text-white shadow-[0_0_18px_rgba(255,45,138,0.45)] ring-1 ring-white/25"
        : "border border-[var(--accent)]/35 bg-black/35 text-white/90 backdrop-blur-[2px] hover:border-[var(--accent)] hover:text-white hover:shadow-[0_0_14px_rgba(255,45,138,0.28)]"
    }`;

  return (
    <nav aria-label={dictionary.common.districts} className="flex gap-2 overflow-x-auto hide-scrollbar">
      <Link href={allHref ?? homePath(locale)} className={chip(allActive)}>
        {dictionary.common.all}
      </Link>
      {districts.map((district) => (
        <Link key={district._id} href={districtPath(countrySlug, district.slug, locale)} className={chip(active === district.slug)}>
          {districtNavLabel(district.slug, pickLocalizedText(district.title, locale))}
        </Link>
      ))}
    </nav>
  );
}
