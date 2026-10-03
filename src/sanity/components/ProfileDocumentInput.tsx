import { useEffect, useRef } from "react";
import { Stack } from "@sanity/ui";
import { set, useFormValue, type ObjectInputProps } from "sanity";
import { deriveSummaryEn } from "@/sanity/lib/deriveSummary";
import { slugifyName } from "@/sanity/lib/slugifyName";
import { ProfilePhotosInput } from "@/sanity/components/ProfilePhotosInput";
import type { SanityImage } from "@/types/content";

interface LocaleText {
  _type?: string;
  en?: string;
  zhHantHK?: string;
}

/**
 * Auto slug, Hong Kong country, and English summary. Image fields are
 * replaced by one photo tray; they remain on the document.
 */
export function ProfileDocumentInput(props: ObjectInputProps) {
  const displayName = useFormValue(["displayName"]) as string | undefined;
  const slug = useFormValue(["slug"]) as { current?: string } | undefined;
  const body = useFormValue(["body"]) as LocaleText | undefined;
  const summary = useFormValue(["summary"]) as LocaleText | undefined;
  const mainImage = useFormValue(["mainImage"]) as SanityImage | undefined;
  const gallery = useFormValue(["gallery"]) as SanityImage[] | undefined;
  const { onChange, readOnly } = props;
  const lastAutoSlug = useRef<string | undefined>(undefined);

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

  const members = props.members.filter((member) => {
    if (member.kind !== "field") return true;
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
