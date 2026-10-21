import { defineField, defineType } from "sanity";
import { RESERVED_SEGMENTS } from "@/lib/slugs";
import { blockArchiveWithActiveProfiles } from "@/sanity/schemaTypes/validators/archiveGuard";
import { districtCountryHasNoProfileConflicts } from "@/sanity/schemaTypes/validators/districtCountryHasNoProfileConflicts";
import { immutablePublishedSlug } from "@/sanity/schemaTypes/validators/immutablePublishedSlug";
import {
  slugIsUniqueWithinCountry,
  uniqueSlugWithinCountry,
} from "@/sanity/schemaTypes/validators/uniqueSlugWithinCountry";

export const district = defineType({
  name: "district",
  title: "District",
  type: "document",
  fields: [
    defineField({
      name: "country",
      title: "Country",
      type: "reference",
      to: [{ type: "country" }],
      options: { disableNew: true, filter: "useDistricts != false" },
      validation: (rule) => districtCountryHasNoProfileConflicts()(rule.required()),
    }),
    defineField({
      name: "title",
      title: "Title",
      description: "District name shown on the site, e.g. Orchard.",
      type: "localeString",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "internalName",
      title: "Internal name (Studio only)",
      description: "Usually the same as the title.",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      description:
        "Part of the canonical URL — click Generate. Treat as immutable once published — renaming requires a 301 entry in src/lib/permanentRedirects.ts for every locale, followed by a deploy. Unique within the selected country.",
      type: "slug",
      options: {
        source: (document) => {
          const draft = document as { internalName?: string; title?: { en?: string } };
          return draft.title?.en || draft.internalName || "";
        },
        maxLength: 64,
        isUnique: slugIsUniqueWithinCountry("district"),
      },
      validation: (rule) =>
        immutablePublishedSlug()(
          uniqueSlugWithinCountry("district")(
            rule.required().custom((slug) => {
              if (!slug?.current) return true;
              return RESERVED_SEGMENTS.has(slug.current) ? `"${slug.current}" is a reserved path segment.` : true;
            }),
          ),
        ),
    }),
    defineField({ name: "intro", title: "Intro", type: "localeText", validation: (rule) => rule.required() }),
    defineField({ name: "body", title: "Body", type: "localeText" }),
    defineField({ name: "image", title: "Hero image", type: "localeImage" }),
    defineField({ name: "seoTitle", title: "SEO title (optional override)", type: "localeString" }),
    defineField({ name: "seoDescription", title: "SEO description (optional override)", type: "localeText" }),
    defineField({
      name: "status",
      title: "Status",
      description: "The district tab appears on the site only once it has at least one visible profile.",
      type: "string",
      options: {
        list: [
          { title: "Active", value: "active" },
          { title: "Archived", value: "archived" },
        ],
        layout: "radio",
      },
      initialValue: "active",
      validation: (rule) => blockArchiveWithActiveProfiles("district")(rule.required()),
    }),
    defineField({ name: "sortOrder", title: "Sort order", type: "number", initialValue: 0 }),
  ],
  preview: {
    select: { title: "title.en", country: "country.title.en", internalName: "internalName", media: "image" },
    prepare: ({ title, country, internalName, media }) => ({
      title: title || internalName || "Untitled",
      subtitle: [country, internalName].filter(Boolean).join(" · "),
      media,
    }),
  },
});
