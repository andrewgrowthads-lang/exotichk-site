import { useEffect, useRef } from "react";
import { Stack } from "@sanity/ui";
import { set, useClient, useEditState, useFormValue, type ObjectInputProps } from "sanity";
import { deriveSummaryEn } from "@/sanity/lib/deriveSummary";
import { slugifyName } from "@/sanity/lib/slugifyName";
import { ProfilePhotosInput } from "@/sanity/components/ProfilePhotosInput";
import type { SanityImage } from "@/types/content";

let cachedHongKongId: string | null | undefined;

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
  const country = useFormValue(["country"]) as { _ref?: string } | undefined;
  const body = useFormValue(["body"]) as LocaleText | undefined;
  const summary = useFormValue(["summary"]) as LocaleText | undefined;
  const mainImage = useFormValue(["mainImage"]) as SanityImage | undefined;
  const gallery = useFormValue(["gallery"]) as SanityImage[] | undefined;
  const documentId = useFormValue(["_id"]) as string | undefined;
  const client = useClient({ apiVersion: "2026-01-01" });
  const { onChange } = props;
  const lastAutoSlug = useRef<string | undefined>(undefined);

  const publishedId = documentId?.replace(/^drafts\./, "") ?? "";
  const { published } = useEditState(publishedId, "profile", "default");
  const publishedSlug = (published?.slug as { current?: string } | undefined)?.current;

  useEffect(() => {
    if (publishedSlug) return;
    const next = displayName?.trim() ? slugifyName(displayName) : "";
    if (!next) return;
    if (slug?.current && slug.current !== lastAutoSlug.current) return;
    lastAutoSlug.current = next;
    if (slug?.current !== next) {
      onChange(set({ _type: "slug", current: next }, ["slug"]));
    }
  }, [displayName, slug, publishedSlug, onChange]);

  useEffect(() => {
    if (country?._ref) return;
    let cancelled = false;
    void (async () => {
      if (cachedHongKongId === undefined) {
        cachedHongKongId = await client.fetch<string | null>(
          `*[_type == "country" && slug.current == "hong-kong"][0]._id`,
        );
      }
      if (cancelled || !cachedHongKongId) return;
      onChange(set({ _type: "reference", _ref: cachedHongKongId }, ["country"]));
    })();
    return () => {
      cancelled = true;
    };
  }, [country?._ref, client, onChange]);

  useEffect(() => {
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
  }, [body?.en, displayName, summary?.en, summary?.zhHantHK, onChange]);

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
      />
    </Stack>
  );
}
