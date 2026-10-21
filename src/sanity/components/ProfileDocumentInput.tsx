import { useEffect, useRef, useState } from "react";
import { Stack } from "@sanity/ui";
import { set, unset, useClient, useFormValue, type ObjectInputProps } from "sanity";
import { deriveSummaryEn } from "@/sanity/lib/deriveSummary";
import { slugifyName } from "@/sanity/lib/slugifyName";
import { ProfilePhotosInput } from "@/sanity/components/ProfilePhotosInput";
import type { SanityImage } from "@/types/content";

interface LocaleText {
  _type?: string;
  en?: string;
  zhHantHK?: string;
}

/** True once the selected country is known to have "Use districts" switched off. */
function useCountryWithoutDistricts(countryRef: string | undefined): boolean {
  const client = useClient({ apiVersion: "2026-01-01" });
  const [loaded, setLoaded] = useState<{ ref: string; withoutDistricts: boolean } | null>(null);

  useEffect(() => {
    if (!countryRef) return;
    let cancelled = false;
    client
      .fetch<boolean | null>(`*[_id == $id][0].useDistricts`, { id: countryRef })
      .then((useDistricts) => {
        if (!cancelled) setLoaded({ ref: countryRef, withoutDistricts: useDistricts === false });
      })
      .catch(() => {
        if (!cancelled) setLoaded({ ref: countryRef, withoutDistricts: false });
      });
    return () => {
      cancelled = true;
    };
  }, [client, countryRef]);

  return Boolean(countryRef && loaded?.ref === countryRef && loaded.withoutDistricts);
}

/**
 * Auto slug and English summary; clears the district when the country
 * changes. District is hidden for countries without districts unless one
 * is already set, so it stays visible and removable. Image fields are
 * replaced by one photo tray; they remain on the document.
 */
export function ProfileDocumentInput(props: ObjectInputProps) {
  const countryRef = (useFormValue(["country"]) as { _ref?: string } | undefined)?._ref;
  const districtRef = (useFormValue(["district"]) as { _ref?: string } | undefined)?._ref;
  const displayName = useFormValue(["displayName"]) as string | undefined;
  const slug = useFormValue(["slug"]) as { current?: string } | undefined;
  const body = useFormValue(["body"]) as LocaleText | undefined;
  const summary = useFormValue(["summary"]) as LocaleText | undefined;
  const mainImage = useFormValue(["mainImage"]) as SanityImage | undefined;
  const gallery = useFormValue(["gallery"]) as SanityImage[] | undefined;
  const { onChange, readOnly } = props;
  const lastAutoSlug = useRef<string | undefined>(undefined);
  const previousCountry = useRef(countryRef);

  // Only reacts to a change made in this form session, so opening an
  // existing profile never touches its district.
  useEffect(() => {
    const previous = previousCountry.current;
    if (previous === countryRef) return;
    previousCountry.current = countryRef;
    if (readOnly || !previous || !districtRef) return;
    onChange(unset(["district"]));
  }, [countryRef, districtRef, readOnly, onChange]);

  useEffect(() => {
    if (readOnly) return;
    const next = displayName?.trim() ? slugifyName(displayName) : "";
    if (!next) return;
    if (slug?.current && slug.current !== lastAutoSlug.current) return;
    lastAutoSlug.current = next;
    if (slug?.current !== next) {
      onChange(set({ _type: "slug", current: next }, ["slug"]));
    }
  }, [displayName, slug, readOnly, onChange]);

  useEffect(() => {
    if (readOnly || !body?.en?.trim()) return;
    const derived = deriveSummaryEn(body?.en, displayName);
    if (!derived || summary?.en === derived) return;
    onChange(
      set(
        {
          _type: "localeText",
          en: derived,
          ...(summary?.zhHantHK ? { zhHantHK: summary.zhHantHK } : {}),
        },
        ["summary"],
      ),
    );
  }, [body?.en, displayName, summary?.en, summary?.zhHantHK, readOnly, onChange]);

  const hideDistrict = useCountryWithoutDistricts(countryRef) && !districtRef;
  const members = props.members.filter((member) => {
    if (member.kind !== "field") return true;
    if (hideDistrict && member.name === "district") return false;
    return member.name !== "mainImage" && member.name !== "gallery";
  });

  return (
    <Stack gap={5}>
      {props.renderDefault({ ...props, members })}
      <ProfilePhotosInput
        mainImage={mainImage}
        gallery={gallery}
        displayName={displayName}
        onChange={onChange}
        readOnly={Boolean(readOnly)}
      />
    </Stack>
  );
}
