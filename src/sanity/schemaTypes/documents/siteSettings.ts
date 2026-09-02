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
export const siteSettings = defineType({
  name: "siteSettings",
  title: "Site settings",
  type: "document",
  fields: [
    defineField({ name: "agencyName", title: "Agency name", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "agencyDescription", title: "Agency description", type: "localeText" }),
    defineField({ name: "defaultSeoTitle", title: "Default SEO title", type: "localeString" }),
    defineField({ name: "defaultSeoDescription", title: "Default SEO description", type: "localeText" }),
    defineField({ name: "defaultSocialImage", title: "Default social share image", type: "image", options: { hotspot: true } }),
    defineField({
      name: "telegramUrl",
      title: "Telegram (fallback)",
      type: "url",
      validation: validateContactUrl("telegram"),
    }),
    defineField({
      name: "whatsappUrl",
      title: "WhatsApp (fallback)",
      type: "url",
      validation: validateContactUrl("whatsapp"),
    }),
    defineField({
      name: "telegramChannelUrl",
      title: "Telegram channel",
      type: "url",
      validation: validateContactUrl("telegramChannel"),
    }),
  ],
  preview: {
    select: { title: "agencyName" },
  },
});
