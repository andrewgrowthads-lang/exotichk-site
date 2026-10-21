import { defineField, defineType } from "sanity";
import { CURRENCY_CODES, CURRENCY_SYMBOLS } from "@/lib/formatPrice";
import { RESERVED_SEGMENTS } from "@/lib/slugs";
import { blockArchiveWithActiveProfiles } from "@/sanity/schemaTypes/validators/archiveGuard";
import { validateContactUrl } from "@/sanity/schemaTypes/validators/contactUrl";
import { immutablePublishedSlug } from "@/sanity/schemaTypes/validators/immutablePublishedSlug";
import { uniqueSlug } from "@/sanity/schemaTypes/validators/uniqueSlug";

interface CountryDraft {
  status?: string;
  telegramUrl?: string;
  whatsappUrl?: string;
}

/**
 * One document per country ("Country settings" in Studio). Contacts here
 * apply only to this country's pages: a field left empty hides that
 * button — it is never filled from another country.
 */
export const country = defineType({
  name: "country",
  title: "Country",
  type: "document",
  groups: [
    { name: "contacts", title: "Contacts", default: true },
    { name: "page", title: "Page text" },
    { name: "background", title: "Background" },
    { name: "seo", title: "SEO" },
    { name: "settings", title: "Settings" },
  ],
  fields: [
    defineField({
      name: "whatsappUrl",
      title: "WhatsApp manager",
      description: "e.g. https://wa.me/6591234567 — shown on every profile in this country. Leave empty to hide the button.",
      type: "url",
      group: "contacts",
      validation: validateContactUrl("whatsapp"),
    }),
    defineField({
      name: "telegramUrl",
      title: "Telegram manager",
      description: "e.g. https://t.me/username — shown on every profile in this country. Leave empty to hide the button.",
      type: "url",
      group: "contacts",
      validation: validateContactUrl("telegram"),
    }),
    defineField({
      name: "telegramChannelUrl",
      title: "Telegram channel (optional)",
      description: "e.g. https://t.me/channel — public channel link. Leave empty to hide it.",
      type: "url",
      group: "contacts",
      validation: validateContactUrl("telegramChannel"),
    }),
    defineField({
      name: "title",
      title: "Title",
      type: "localeString",
      group: "page",
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "intro", title: "Intro", type: "localeText", group: "page", validation: (rule) => rule.required() }),
    defineField({ name: "body", title: "Body", type: "localeText", group: "page" }),
    defineField({
      name: "image",
      title: "Background image",
      description:
        "Full-screen background behind this country's pages, and its card on the location page. Leave empty to use the built-in skyline photo.",
      type: "localeImage",
      group: "background",
    }),
    defineField({ name: "seoTitle", title: "SEO title (optional override)", type: "localeString", group: "seo" }),
    defineField({
      name: "seoDescription",
      title: "SEO description (optional override)",
      type: "localeText",
      group: "seo",
    }),
    defineField({
      name: "currency",
      title: "Currency",
      description: "All prices in this country are shown in this currency.",
      type: "string",
      group: "settings",
      options: {
        list: CURRENCY_CODES.map((code) => ({ title: `${CURRENCY_SYMBOLS[code]} (${code})`, value: code })),
        layout: "radio",
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "internalName",
      title: "Internal name (Studio only)",
      type: "string",
      group: "settings",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      group: "settings",
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
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      group: "settings",
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
    defineField({
      name: "sortOrder",
      title: "Sort order",
      description: "Order on the location page and in the header menu (lowest first).",
      type: "number",
      group: "settings",
      initialValue: 0,
    }),
  ],
  validation: (rule) =>
    rule
      .custom((document) => {
        const draft = document as CountryDraft | undefined;
        if (draft?.status !== "active" || draft.telegramUrl || draft.whatsappUrl) return true;
        return "No WhatsApp or Telegram manager set: profiles in this country will show no contact button.";
      })
      .warning(),
  preview: {
    select: { title: "title.en", internalName: "internalName", currency: "currency", status: "status", media: "image" },
    prepare: ({ title, internalName, currency, status, media }) => ({
      title: title || internalName || "Untitled",
      subtitle: [currency, status === "archived" ? "Archived" : undefined].filter(Boolean).join(" · "),
      media,
    }),
  },
});
