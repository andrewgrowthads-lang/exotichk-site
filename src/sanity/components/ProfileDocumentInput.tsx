import { useEffect, useRef } from "react";
import { set, useEditState, useFormValue, type ObjectInputProps } from "sanity";
import { slugifyName } from "@/sanity/lib/slugifyName";

/**
 * Fills an empty slug from the display name so editors never have to
 * open Advanced just to generate the URL. Follows the name while the
 * document is still unpublished and the slug has not been edited by
 * hand. `immutablePublishedSlug` remains the publish-time guarantee.
 */
export function ProfileDocumentInput(props: ObjectInputProps) {
  const displayName = useFormValue(["displayName"]) as string | undefined;
  const slug = useFormValue(["slug"]) as { current?: string } | undefined;
  const documentId = useFormValue(["_id"]) as string | undefined;
  const { onChange } = props;
  const lastAuto = useRef<string | undefined>(undefined);

  const publishedId = documentId?.replace(/^drafts\./, "") ?? "";
  const { published } = useEditState(publishedId, "profile", "default");
  const publishedSlug = (published?.slug as { current?: string } | undefined)?.current;

  useEffect(() => {
    if (publishedSlug) return;
    const next = displayName?.trim() ? slugifyName(displayName) : "";
    if (!next) return;
    if (slug?.current && slug.current !== lastAuto.current) return;
    lastAuto.current = next;
    if (slug?.current !== next) {
      onChange(set({ _type: "slug", current: next }, ["slug"]));
    }
  }, [displayName, slug, publishedSlug, onChange]);

  return props.renderDefault(props);
}
