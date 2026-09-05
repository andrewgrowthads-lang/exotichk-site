import { useCallback, useMemo, useRef, useState, type DragEvent } from "react";
import { Box, Button, Card, Flex, Stack, Text } from "@sanity/ui";
import imageUrlBuilder from "@sanity/image-url";
import { set, unset, useClient, type FormPatch } from "sanity";
import type { SanityImage } from "@/types/content";

const GALLERY_MAX = 11;
const ACCEPT = "image/jpeg,image/png,image/webp,image/jpg";

type ImageValue = SanityImage & { _type?: string; _key?: string; alt?: { _type?: string; en?: string } };

export function ProfilePhotosInput({
  mainImage,
  gallery,
  displayName,
  onChange,
}: {
  mainImage?: ImageValue;
  gallery?: ImageValue[];
  displayName?: string;
  onChange: (patch: FormPatch | FormPatch[]) => void;
}) {
  const client = useClient({ apiVersion: "2026-01-01" });
  const builder = useMemo(() => imageUrlBuilder(client), [client]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragFrom = useRef<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const photos = useMemo(() => [mainImage, ...(gallery ?? [])].filter((photo): photo is ImageValue => Boolean(photo?.asset)), [mainImage, gallery]);

  const thumb = (photo: ImageValue) => {
    try {
      return builder.image(photo).width(240).height(240).fit("crop").url();
    } catch {
      return undefined;
    }
  };

  const write = useCallback(
    (next: ImageValue[]) => {
      const [main, ...rest] = next;
      onChange([main ? set(stripKey(main), ["mainImage"]) : unset(["mainImage"]), set(rest.map(ensureKey), ["gallery"])]);
    },
    [onChange],
  );

  const addFiles = useCallback(
    async (files: File[]) => {
      const images = files.filter((file) => /^image\/(jpeg|jpg|png|webp)$/i.test(file.type) || /\.(jpe?g|png|webp)$/i.test(file.name));
      if (images.length === 0) {
        setError("Use JPG, PNG, or WebP photos.");
        return;
      }
      const room = 1 + GALLERY_MAX - photos.length;
      if (room <= 0) {
        setError(`Maximum ${1 + GALLERY_MAX} photos.`);
        return;
      }
      const toUpload = images.slice(0, room);
      setBusy(true);
      setError(toUpload.length < images.length ? `Only ${room} more photo${room === 1 ? "" : "s"} can be added.` : null);
      try {
        const uploaded: ImageValue[] = [];
        for (const file of toUpload) {
          const asset = await client.assets.upload("image", file, { filename: file.name });
          uploaded.push({
            _type: "image",
            _key: crypto.randomUUID(),
            asset: { _ref: asset._id, _type: "reference" },
            alt: { _type: "localeString", en: displayName?.trim() || "Photo" },
          } as ImageValue);
        }
        write([...photos, ...uploaded]);
      } catch {
        setError("Photo upload failed. Try again.");
      } finally {
        setBusy(false);
      }
    },
    [client, displayName, photos, write],
  );

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    if (files.length > 0) void addFiles(files);
  };

  const onReorderDrop = (to: number) => {
    const from = dragFrom.current;
    dragFrom.current = null;
    if (from == null || from === to) return;
    const next = photos.slice();
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    write(next);
  };

  return (
    <Stack gap={3}>
      <Text size={1} weight="semibold">
        Photos
      </Text>
      <Card
        padding={4}
        radius={2}
        tone={busy ? "transparent" : "primary"}
        border
        onDragOver={(event) => event.preventDefault()}
        onDrop={onDrop}
        style={{ borderStyle: "dashed", cursor: "pointer" }}
        onClick={() => inputRef.current?.click()}
      >
        <Stack gap={2}>
          <Text align="center" size={1}>
            {busy ? "Uploading…" : "Drag & drop photos here, or click to select several at once."}
          </Text>
          <Text align="center" muted size={1}>
            First photo is the main photo. Drag photos to reorder.
          </Text>
        </Stack>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          hidden
          onChange={(event) => {
            const files = Array.from(event.currentTarget.files ?? []);
            event.currentTarget.value = "";
            if (files.length > 0) void addFiles(files);
          }}
        />
      </Card>
      {error && (
        <Text size={1} style={{ color: "var(--card-badge-critical-fg-color, #c23)" }}>
          {error}
        </Text>
      )}
      {photos.length > 0 && (
        <Flex gap={2} wrap="wrap">
          {photos.map((photo, index) => (
            <Card
              key={photo._key ?? photo.asset?._ref ?? String(index)}
              padding={1}
              radius={2}
              border
              draggable
              onDragStart={() => {
                dragFrom.current = index;
              }}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onReorderDrop(index);
              }}
              style={{ width: 112, position: "relative" }}
            >
              <Box style={{ aspectRatio: "1 / 1", overflow: "hidden", borderRadius: 4, background: "#1a1018" }}>
                {thumb(photo) ? (
                  // Studio-only thumbnail. Public pages still use CatalogPhoto.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={thumb(photo)} alt="" style={{ height: "100%", width: "100%", objectFit: "cover" }} />
                ) : null}
              </Box>
              <Flex justify="space-between" align="center" paddingTop={2} gap={1}>
                <Text size={0} muted>
                  {index === 0 ? "Main" : String(index + 1).padStart(2, "0")}
                </Text>
                <Button
                  mode="bleed"
                  tone="critical"
                  fontSize={0}
                  padding={1}
                  text="Remove"
                  onClick={() => write(photos.filter((_, i) => i !== index))}
                />
              </Flex>
            </Card>
          ))}
        </Flex>
      )}
    </Stack>
  );
}

function ensureKey(photo: ImageValue): ImageValue {
  return photo._key ? photo : { ...photo, _key: crypto.randomUUID() };
}

function stripKey(photo: ImageValue): ImageValue {
  const { _key: _unused, ...rest } = photo;
  return rest;
}
