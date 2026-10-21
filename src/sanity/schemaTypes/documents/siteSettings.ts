import { defineField, defineType } from "sanity";
import { validateContactUrl } from "@/sanity/schemaTypes/validators/contactUrl";

/**
 * Singleton. The Studio structure (see `sanity.config.ts`) pins this to a
 * single fixed document and hides it from the generic "create new" list.
 *
 * Deliberately does NOT hold the production base URL: that value drives
 * canonical/hreflang/sitemap for the entire site, and a typo made in the
 * CMS (with no code review, no history, no rollback) would break SEO
 * instantly. The base URL lives in an environment variable instead.
 */
const LEGACY_CONTACT_NOTE =
  "Read-only. Contacts are now edited per country under Country settings. This value is used only for Hong Kong, and only while the Hong Kong country has no contacts of its own.";

export const siteSettings = defineType({
  name: "siteSettings",
  title: "Site settings",
  type: "document",
  groups: [
    { name: "brand", title: "Brand", default: true },
    { name: "contact", title: "Legacy contacts" },
    { name: "social", title: "Social" },
  ],
  fields: [
    defineField({
      name: "agencyName",
      title: "Agency name",
      type: "string",
      group: "brand",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "agencyDescription",
      title: "Agency description",
      type: "localeText",
      group: "brand",
    }),
    defineField({
      name: "logo",
      title: "Logo",
      description: "Used in structured data for search engines. Not shown directly on the site.",
      type: "image",
      options: { hotspot: true },
      group: "brand",
    }),
    defineField({
      name: "telegramUrl",
      title: "Telegram (legacy)",
      description: LEGACY_CONTACT_NOTE,
      type: "url",
      group: "contact",
      readOnly: true,
      hidden: ({ value }) => !value,
      validation: validateContactUrl("telegram"),
    }),
    defineField({
      name: "whatsappUrl",
      title: "WhatsApp (legacy)",
      description: LEGACY_CONTACT_NOTE,
      type: "url",
      group: "contact",
      readOnly: true,
      hidden: ({ value }) => !value,
      validation: validateContactUrl("whatsapp"),
    }),
    defineField({
      name: "telegramChannelUrl",
      title: "Telegram channel (legacy)",
      description: LEGACY_CONTACT_NOTE,
      type: "url",
      group: "contact",
      readOnly: true,
      hidden: ({ value }) => !value,
      validation: validateContactUrl("telegramChannel"),
    }),
    defineField({
      name: "defaultSeoTitle",
      title: "Default SEO title",
      description: "Optional title for the location page (/). Other pages use their own entity-specific title or SEO override.",
      type: "localeString",
      group: "social",
    }),
    defineField({
      name: "defaultSeoDescription",
      title: "Default meta description",
      description: "Optional meta description for the location page (/). Other pages use their own localized content.",
      type: "localeText",
      group: "social",
    }),
    defineField({
      name: "defaultSocialImage",
      title: "Default social share image",
      description: "Shown when a page is shared and has no photo of its own to use instead.",
      type: "image",
      options: { hotspot: true },
      group: "social",
    }),
  ],
  preview: {
    select: { title: "agencyName", media: "logo" },
  },
});
