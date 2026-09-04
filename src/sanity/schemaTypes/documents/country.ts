import { defineField, defineType } from "sanity";
import { RESERVED_SEGMENTS } from "@/lib/slugs";
import { blockArchiveWithActiveProfiles } from "@/sanity/schemaTypes/validators/archiveGuard";
import { immutablePublishedSlug } from "@/sanity/schemaTypes/validators/immutablePublishedSlug";
import { uniqueSlug } from "@/sanity/schemaTypes/validators/uniqueSlug";

export const country = defineType({
  name: "country",
  title: "Country",
  type: "document",
  fields: [
    defineField({
      name: "internalName",
      title: "Internal name (Studio only)",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      description:
        "Part of the canonical URL. Treat as immutable once published — renaming requires 301 entries in src/lib/permanentRedirects.ts for this country and every child URL, followed by a deploy.",
      options: { source: "internalName", maxLength: 64 },
      validation: (rule) =>
        immutablePublishedSlug()(
          uniqueSlug("country")(
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
      validation: (rule) => blockArchiveWithActiveProfiles("country")(rule.required()),
    }),
    defineField({ name: "sortOrder", title: "Sort order", type: "number", initialValue: 0 }),
  ],
  preview: {
    select: { title: "internalName", subtitle: "status", media: "image" },
  },
});
