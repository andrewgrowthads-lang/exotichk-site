import Link from "next/link";
import type { LocaleId } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
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
    `flex shrink-0 items-center rounded-md px-3.5 text-[12px] font-medium tracking-[0.12em] uppercase min-h-10 transition-colors ${
      isActive
        ? "bg-[var(--accent)] text-white"
        : "border border-[var(--line)] bg-[var(--surface)] text-[var(--foreground)] hover:border-[var(--accent)]/60"
    }`;

  return (
    <nav aria-label={dictionary.common.districts} className="flex gap-2 overflow-x-auto hide-scrollbar">
      <Link href={allHref ?? homePath(locale)} className={chip(allActive)}>
        {dictionary.common.all}
      </Link>
      {districts.map((district) => (
        <Link key={district._id} href={districtPath(countrySlug, district.slug, locale)} className={chip(active === district.slug)}>
          {pickLocalizedText(district.title, locale)}
        </Link>
      ))}
    </nav>
  );
}
