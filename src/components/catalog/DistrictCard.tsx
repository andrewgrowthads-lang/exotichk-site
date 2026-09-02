import Link from "next/link";
import type { LocaleId } from "@/i18n/config";
import { pickLocalizedText } from "@/lib/localize";
import { districtPath } from "@/lib/urls";
import { SanityImg } from "@/components/media/SanityImg";
import type { DistrictSummary } from "@/types/content";

export function DistrictCard({
  district,
  countrySlug,
  locale,
}: {
  district: DistrictSummary;
  countrySlug: string;
  locale: LocaleId;
}) {
  const title = pickLocalizedText(district.title, locale);
  return (
    <Link
      href={districtPath(countrySlug, district.slug, locale)}
      className="group block overflow-hidden rounded-xl border border-neutral-200 transition hover:border-neutral-300 dark:border-neutral-800 dark:hover:border-neutral-700"
    >
      <div className="aspect-[4/3] overflow-hidden bg-neutral-100 dark:bg-neutral-900">
        <SanityImg
          image={district.image}
          locale={locale}
          fallbackAlt={title}
          sizes="(min-width: 768px) 33vw, 100vw"
          className="h-full w-full object-cover transition group-hover:scale-105"
        />
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">{title}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-neutral-600 dark:text-neutral-400">
          {pickLocalizedText(district.intro, locale)}
        </p>
      </div>
    </Link>
  );
}
