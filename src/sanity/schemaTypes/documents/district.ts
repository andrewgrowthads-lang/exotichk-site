import { defineField, defineType } from "sanity";
import { RESERVED_SEGMENTS } from "@/lib/slugs";
import { blockArchiveWithActiveProfiles } from "@/sanity/schemaTypes/validators/archiveGuard";
import { districtCountryHasNoProfileConflicts } from "@/sanity/schemaTypes/validators/districtCountryHasNoProfileConflicts";
import { immutablePublishedSlug } from "@/sanity/schemaTypes/validators/immutablePublishedSlug";
import { uniqueSlugWithinCountry } from "@/sanity/schemaTypes/validators/uniqueSlugWithinCountry";

export const district = defineType({
  name: "district",
  title: "District",
  type: "document",
  fields: [
    defineField({
      name: "internalName",
      title: "Internal name (Studio only)",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "country",
      title: "Country",
      type: "reference",
      to: [{ type: "country" }],
      validation: (rule) => districtCountryHasNoProfileConflicts()(rule.required()),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      description:
        "Part of the canonical URL. Treat as immutable once published — renaming requires a 301 entry in src/lib/permanentRedirects.ts for every locale, followed by a deploy. Unique within the selected country.",
      type: "slug",
      options: { source: "internalName", maxLength: 64 },
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
    defineField({ name: "title", title: "Title", type: "localeString", validation: (rule) => rule.required() }),
    defineField({ name: "intro", title: "Intro", type: "localeText", validation: (rule) => rule.required() }),
    defineField({ name: "body", title: "Body", type: "localeText" }),
    defineField({ name: "image", title: "Hero image", type: "localeImage" }),
    defineField({ name: "seoTitle", title: "SEO title (optional override)", type: "localeString" }),
    defineField({ name: "seoDescription", title: "SEO description (optional override)", type: "localeText" }),
    defineField({
      name: "status",
      title: "Status",
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
    select: { title: "internalName", subtitle: "status", media: "image" },
  },
});
