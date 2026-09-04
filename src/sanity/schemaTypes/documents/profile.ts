import { defineField, defineType } from "sanity";
import { PUBLISHED_STATUS } from "@/lib/visibility";
import { validateContactUrl } from "@/sanity/schemaTypes/validators/contactUrl";
import { districtBelongsToCountry } from "@/sanity/schemaTypes/validators/districtBelongsToCountry";
import { immutablePublishedSlug } from "@/sanity/schemaTypes/validators/immutablePublishedSlug";
import { uniqueSlugWithinCountry } from "@/sanity/schemaTypes/validators/uniqueSlugWithinCountry";

interface ProfileDraft {
  status?: string;
  telegramUrl?: string;
  whatsappUrl?: string;
  mainImage?: unknown;
}

const STATUS_OPTIONS = [
  { title: "Active", value: "active" },
  { title: "Temporarily unavailable", value: "temporarilyUnavailable" },
  { title: "Archived", value: "archived" },
];

export const profile = defineType({
  name: "profile",
  title: "Profile",
  type: "document",
  groups: [
    { name: "content", title: "Content", default: true },
    { name: "photos", title: "Photos" },
    { name: "details", title: "Details" },
    { name: "contact", title: "Contact" },
    { name: "seo", title: "SEO" },
  ],
  fields: [
    // --- Content: name, location, publishing state ---
    defineField({
      name: "internalName",
      title: "Internal ID",
      type: "string",
      description:
        'A short code to tell profiles apart, e.g. "HK015". Not shown on the page, but included in the pre-filled WhatsApp message when a visitor taps "Contact on WhatsApp" (e.g. "Hi! I\'m interested in Anna — HK015.") — keep it short and stable.',
      group: "content",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "displayName",
      title: "Display name",
      type: "string",
      description: "The name shown on the site. Not translated — used as-is in both languages.",
      group: "content",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "country",
      title: "Country",
      type: "reference",
      to: [{ type: "country" }],
      group: "content",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "district",
      title: "District",
      type: "reference",
      to: [{ type: "district" }],
      description: "Must belong to the selected country. The district does not appear in the profile's web address.",
      group: "content",
      validation: (rule) => districtBelongsToCountry()(rule.required()),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      description:
        "Part of the web address (/{country}/profiles/{slug}/). Generated from the display name — avoid changing it after the first publish. If it must change, add a 301 entry for every locale in src/lib/permanentRedirects.ts before publishing.",
      type: "slug",
      options: { source: "displayName", maxLength: 64 },
      group: "content",
      validation: (rule) =>
        immutablePublishedSlug()(uniqueSlugWithinCountry("profile")(rule.required())),
    }),
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      description:
        'Controls where this profile shows up. To keep working on a profile without publishing it, just leave it unpublished (the "Publish" button) — that is Draft, no status value needed for it.',
      options: { list: STATUS_OPTIONS, layout: "radio" },
      initialValue: "active",
      group: "content",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "featured",
      title: "Featured",
      type: "boolean",
      description: "Featured profiles are shown first, ahead of the sort order below.",
      initialValue: false,
      group: "content",
    }),
    defineField({
      name: "sortOrder",
      title: "Sort order",
      type: "number",
      description: "Lower numbers appear first (after any featured profiles).",
      initialValue: 0,
      group: "content",
    }),

    // --- Photos ---
    defineField({
      name: "mainImage",
      title: "Main photo",
      description: "The cover photo shown on cards and first in the gallery.",
      type: "localeImage",
      group: "photos",
    }),
    defineField({
      name: "gallery",
      title: "Gallery",
      description: "Additional photos, shown after the main photo. Optional.",
      type: "array",
      of: [{ type: "localeImage" }],
      validation: (rule) => rule.max(11),
      group: "photos",
    }),

    // --- Details ---
    defineField({
      name: "age",
      title: "Age",
      type: "number",
      group: "details",
      validation: (rule) => rule.integer().min(18).max(99),
    }),
    defineField({
      name: "height",
      title: "Height (cm)",
      type: "number",
      group: "details",
      validation: (rule) => rule.integer().min(100).max(220),
    }),
    defineField({
      name: "nationality",
      title: "Nationality",
      type: "string",
      description: 'Free text, e.g. "Filipino". Shown as-is on the site.',
      group: "details",
    }),
    defineField({
      name: "languages",
      title: "Languages",
      description: 'Type a language name and press enter, e.g. "English". Add as many as needed.',
      type: "array",
      of: [{ type: "string" }],
      options: { layout: "tags" },
      group: "details",
    }),
    defineField({
      name: "summary",
      title: "Short description",
      description: "One or two sentences. Shown on the profile page, right under the name.",
      type: "localeText",
      group: "details",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "body",
      title: "Full description",
      description: "The longer text further down the profile page. Optional.",
      type: "localeText",
      group: "details",
    }),
    defineField({
      name: "attributes",
      title: "Additional characteristics",
      description: 'Short free-form tags, e.g. "Non-smoker", "GFE", "Overnight available".',
      type: "array",
      of: [{ type: "string" }],
      options: { layout: "tags" },
      group: "details",
    }),

    // --- Contact ---
    defineField({
      name: "telegramUrl",
      title: "Telegram (overrides site default)",
      type: "url",
      group: "contact",
      validation: validateContactUrl("telegram"),
    }),
    defineField({
      name: "whatsappUrl",
      title: "WhatsApp (overrides site default)",
      type: "url",
      group: "contact",
      validation: validateContactUrl("whatsapp"),
    }),
    defineField({
      name: "telegramChannelUrl",
      title: "Telegram channel (overrides site default)",
      type: "url",
      group: "contact",
      validation: validateContactUrl("telegramChannel"),
    }),
    defineField({
      name: "unavailableMessage",
      title: "Unavailable message",
      description: 'Shown to visitors while status is "Temporarily unavailable". Optional.',
      type: "localeText",
      group: "contact",
    }),
    defineField({
      name: "publishedAt",
      title: "Published at",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
      group: "contact",
    }),

    // --- SEO ---
    defineField({
      name: "seoTitle",
      title: "SEO title (optional override)",
      description: "Shown in the browser tab and Google search results. Leave blank to use the display name.",
      type: "localeString",
      group: "seo",
    }),
    defineField({
      name: "seoDescription",
      title: "Meta description (optional override)",
      description: "The snippet shown under the title in Google search results. Leave blank to use the short description.",
      type: "localeText",
      group: "seo",
    }),
    defineField({
      name: "h1Override",
      title: "H1 override (optional)",
      description: "Replaces the on-page heading. Leave blank to use the display name.",
      type: "localeString",
      group: "seo",
    }),
    defineField({
      name: "ogImage",
      title: "Social share image (optional)",
      description: "Shown when this profile's link is shared on WhatsApp, Telegram, etc. Leave blank to use the main photo.",
      type: "image",
      options: { hotspot: true },
      group: "seo",
    }),
    defineField({
      name: "seoNoIndex",
      title: "Hide from search engines",
      description:
        "Keeps the page visible on the site and reachable by link, but asks Google not to index it. The profile still stays out of Google either way while Archived.",
      type: "boolean",
      initialValue: false,
      group: "seo",
    }),
  ],
  validation: (rule) =>
    rule.custom(async (document, context) => {
      const draft = document as ProfileDraft | undefined;
      const status = draft?.status;
      if (!status) return true;

      // Sourced from `lib/visibility.ts` rather than re-listed here, so a
      // new publicly-rendered status cannot be added without inheriting
      // the contact requirement below.
      const publiclyRendered = (PUBLISHED_STATUS.profile as readonly string[]).includes(status);
      if (!publiclyRendered) return true;

      // A temporarily unavailable profile may legitimately be mid-update,
      // so only a fully active one is required to have its photo.
      if (status === "active" && !draft?.mainImage) {
        return "An active profile needs at least a main photo.";
      }

      // Every publicly rendered status shows the contact CTA, including
      // "temporarily unavailable" — that page's whole point is that a
      // visitor can still message the manager. Without a link here or a
      // site-wide default, the profile ships with no way to reach anyone.
      if (draft?.telegramUrl || draft?.whatsappUrl) return true;
      const client = context.getClient({ apiVersion: "2026-01-01" });
      const settings = await client.fetch<{ telegramUrl?: string; whatsappUrl?: string } | null>(
        `*[_type == "siteSettings"][0]{ telegramUrl, whatsappUrl }`,
      );
      if (settings?.telegramUrl || settings?.whatsappUrl) return true;
      return "A published profile needs at least one contact method, either on the profile or as a site-wide default.";
    }),
  preview: {
    select: { title: "displayName", subtitle: "status", media: "mainImage" },
  },
});
