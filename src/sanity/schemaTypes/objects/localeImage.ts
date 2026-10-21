import { defineField, defineType } from "sanity";

/**
 * A single image with hotspot/crop for responsive cropping and a
 * localized `alt` field. Alt falls back to the default locale at render
 * time (see `lib/visibility.ts` callers) rather than being required here,
 * so a missing Chinese alt text cannot take down an otherwise-complete
 * Chinese page.
 *
 * Not required by itself: country and district images are optional, and a
 * profile's photo requirement lives in the profile's document validation.
 */
export const localeImage = defineType({
  name: "localeImage",
  title: "Image",
  type: "image",
  options: { hotspot: true },
  fields: [
    defineField({
      name: "alt",
      title: "Alt text",
      type: "localeString",
      description: "Describe what is in the image. Do not keyword-stuff.",
    }),
  ],
});
