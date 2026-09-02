import { defineField, defineType } from "sanity";
import { validateContactUrl } from "@/sanity/schemaTypes/validators/contactUrl";
import { districtBelongsToCountry } from "@/sanity/schemaTypes/validators/districtBelongsToCountry";
import { uniqueSlugWithinCountry } from "@/sanity/schemaTypes/validators/uniqueSlugWithinCountry";

interface ProfileDraft {
  status?: string;
  telegramUrl?: string;
  whatsappUrl?: string;
}

export const profile = defineType({
  name: "profile",
  title: "Profile",
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
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "district",
      title: "District",
      type: "reference",
      to: [{ type: "district" }],
      description: "Must belong to the selected country. The district does not appear in the profile URL.",
      validation: (rule) => districtBelongsToCountry()(rule.required()),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      description:
        "Part of the canonical URL (/{country}/profiles/{slug}/). Treat as immutable once published. Unique within the selected country.",
      type: "slug",
      options: { source: "displayName", maxLength: 64 },
      validation: (rule) => uniqueSlugWithinCountry("profile")(rule.required()),
    }),
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      options: { list: ["active", "temporarilyUnavailable", "archived"] },
      initialValue: "active",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "displayName",
      title: "Display name",
      type: "string",
      description: "Not translated — used as-is across locales.",
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "summary", title: "Summary", type: "localeText", validation: (rule) => rule.required() }),
    defineField({ name: "body", title: "Body", type: "localeText" }),
    defineField({
      name: "attributes",
      title: "Attributes",
      type: "array",
      of: [{ type: "string" }],
    }),
    defineField({
      name: "images",
      title: "Images",
      type: "array",
      of: [{ type: "localeImage" }],
      validation: (rule) => rule.min(1).max(12),
    }),
    defineField({
      name: "telegramUrl",
      title: "Telegram (overrides site default)",
      type: "url",
      validation: validateContactUrl("telegram"),
    }),
    defineField({
      name: "whatsappUrl",
      title: "WhatsApp (overrides site default)",
      type: "url",
      validation: validateContactUrl("whatsapp"),
    }),
    defineField({
      name: "telegramChannelUrl",
      title: "Telegram channel (overrides site default)",
      type: "url",
      validation: validateContactUrl("telegramChannel"),
    }),
    defineField({ name: "seoTitle", title: "SEO title (optional override)", type: "localeString" }),
    defineField({ name: "seoDescription", title: "SEO description (optional override)", type: "localeText" }),
    defineField({
      name: "unavailableMessage",
      title: "Unavailable message",
      description: 'Shown when status is "Temporarily unavailable".',
      type: "localeText",
    }),
    defineField({
      name: "publishedAt",
      title: "Published at",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
    }),
  ],
  validation: (rule) =>
    rule.custom(async (document, context) => {
      const draft = document as ProfileDraft | undefined;
      if (draft?.status !== "active") return true;
      if (draft.telegramUrl || draft.whatsappUrl) return true;

      const client = context.getClient({ apiVersion: "2026-01-01" });
      const settings = await client.fetch<{ telegramUrl?: string; whatsappUrl?: string } | null>(
        `*[_type == "siteSettings"][0]{ telegramUrl, whatsappUrl }`,
      );
      if (settings?.telegramUrl || settings?.whatsappUrl) return true;
      return "An active profile needs at least one contact method, either on the profile or as a site-wide default.";
    }),
  preview: {
    select: { title: "displayName", subtitle: "status" },
  },
});
