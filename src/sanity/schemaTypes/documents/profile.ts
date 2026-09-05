import { defineField, defineType } from "sanity";
import { PUBLISHED_STATUS } from "@/lib/visibility";
import { ProfileDocumentInput } from "@/sanity/components/ProfileDocumentInput";
import { generateInternalId } from "@/sanity/lib/generateInternalId";
import { validateContactUrl } from "@/sanity/schemaTypes/validators/contactUrl";
import { districtBelongsToCountry } from "@/sanity/schemaTypes/validators/districtBelongsToCountry";
import { immutableInternalName } from "@/sanity/schemaTypes/validators/immutableInternalName";
import { immutablePublishedSlug } from "@/sanity/schemaTypes/validators/immutablePublishedSlug";
import { uniqueInternalName } from "@/sanity/schemaTypes/validators/uniqueInternalName";
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

let siteContactCache: { at: number; value: { telegramUrl?: string; whatsappUrl?: string } | null } | null =
  null;
/** Debounces the site-settings GROQ that otherwise ran on every keystroke. Publish still re-validates; 5s is shorter than a deliberate settings change. */
const SITE_CONTACT_CACHE_MS = 5_000;

export const profile = defineType({
  name: "profile",
  title: "Profile",
  type: "document",
  components: { input: ProfileDocumentInput },
  groups: [
    { name: "basic", title: "Basic", default: true },
    { name: "advanced", title: "Advanced" },
    { name: "contact", title: "Contact overrides" },
    { name: "seo", title: "Advanced SEO" },
  ],
  fields: [
    defineField({
      name: "displayName",
      title: "Display name",
      type: "string",
      description: "The name shown on the site. Not translated — used as-is in both languages.",
      group: "basic",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "country",
      title: "Country",
      type: "reference",
      to: [{ type: "country" }],
      group: "basic",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "district",
      title: "District",
      type: "reference",
      to: [{ type: "district" }],
      description: "Must belong to the selected country. The district does not appear in the profile's web address.",
      group: "basic",
      validation: (rule) => districtBelongsToCountry()(rule.required()),
    }),
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      description:
        'Controls where this profile shows up. To keep working on a profile without publishing it, just leave it unpublished (the "Publish" button).',
      options: { list: STATUS_OPTIONS, layout: "radio" },
      initialValue: "active",
      group: "basic",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "age",
      title: "Age",
      type: "number",
      group: "basic",
      validation: (rule) => rule.integer().min(18).max(99),
    }),
    defineField({
      name: "height",
      title: "Height (cm)",
      type: "number",
      group: "basic",
      validation: (rule) => rule.integer().min(100).max(220),
    }),
    defineField({
      name: "price",
      title: "Price (HKD)",
      description: "One price in Hong Kong dollars. Shown on the card as HK$ 1500. Enter digits only — do not type HK$.",
      type: "number",
      group: "basic",
      validation: (rule) => rule.integer().min(1).max(999999),
    }),
    defineField({
      name: "nationality",
      title: "Nationality",
      type: "string",
      description: 'Free text, e.g. "Filipino". Shown as-is on the site.',
      group: "basic",
    }),
    defineField({
      name: "languages",
      title: "Languages",
      description: 'Type a language name and press enter, e.g. "English". Add as many as needed.',
      type: "array",
      of: [{ type: "string" }],
      options: { layout: "tags" },
      group: "basic",
    }),
    defineField({
      name: "mainImage",
      title: "Main photo",
      description: "The cover photo shown on cards and first in the gallery.",
      type: "localeImage",
      group: "basic",
    }),
    defineField({
      name: "gallery",
      title: "Gallery",
      description: "Additional photos, shown after the main photo. Optional. You can select multiple files at once.",
      type: "array",
      of: [{ type: "localeImage" }],
      options: { layout: "grid" },
      validation: (rule) => rule.max(11),
      group: "basic",
    }),
    defineField({
      name: "summary",
      title: "English summary",
      description:
        "One or two sentences under the name. Chinese is generated with “Generate / Update 中文” in the document menu.",
      type: "localeText",
      group: "basic",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "body",
      title: "English description",
      description: "Longer text further down the profile page. Optional. Chinese is generated with the 中文 action.",
      type: "localeText",
      group: "basic",
    }),

    defineField({
      name: "internalName",
      title: "Internal ID",
      type: "string",
      description: "Assigned automatically once. Included in the pre-filled WhatsApp message. Not shown on the page.",
      group: "advanced",
      readOnly: true,
      initialValue: generateInternalId,
      validation: (rule) => immutableInternalName()(uniqueInternalName()(rule.required())),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      description:
        "Part of the web address (/{country}/profiles/{slug}/). Filled from the display name — do not change it after the first publish. If it must change, add a 301 in src/lib/permanentRedirects.ts first.",
      type: "slug",
      options: { source: "displayName", maxLength: 64 },
      group: "advanced",
      validation: (rule) =>
        immutablePublishedSlug()(uniqueSlugWithinCountry("profile")(rule.required())),
    }),
    defineField({
      name: "featured",
      title: "Featured",
      type: "boolean",
      description: "Featured profiles are shown first, ahead of the sort order below.",
      initialValue: false,
      group: "advanced",
    }),
    defineField({
      name: "sortOrder",
      title: "Sort order",
      type: "number",
      description: "Lower numbers appear first (after any featured profiles).",
      initialValue: 0,
      group: "advanced",
    }),
    defineField({
      name: "attributes",
      title: "Additional characteristics",
      description: 'Short free-form tags, e.g. "Non-smoker", "GFE", "Overnight available".',
      type: "array",
      of: [{ type: "string" }],
      options: { layout: "tags" },
      group: "advanced",
    }),
    defineField({
      name: "publishedAt",
      title: "Published at",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
      group: "advanced",
    }),
    defineField({
      name: "translationMeta",
      title: "Translation metadata",
      type: "object",
      hidden: true,
      group: "advanced",
      fields: [
        defineField({ name: "summaryEn", type: "string" }),
        defineField({ name: "summaryZh", type: "string" }),
        defineField({ name: "bodyEn", type: "string" }),
        defineField({ name: "bodyZh", type: "string" }),
        defineField({ name: "seoTitleEn", type: "string" }),
        defineField({ name: "seoTitleZh", type: "string" }),
        defineField({ name: "seoDescriptionEn", type: "string" }),
        defineField({ name: "seoDescriptionZh", type: "string" }),
      ],
    }),

    defineField({
      name: "telegramUrl",
      title: "Telegram (overrides site default)",
      description: "Leave empty to use the Site settings contact.",
      type: "url",
      group: "contact",
      validation: validateContactUrl("telegram"),
    }),
    defineField({
      name: "whatsappUrl",
      title: "WhatsApp (overrides site default)",
      description: "Leave empty to use the Site settings contact.",
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
      name: "seoTitle",
      title: "SEO title (optional override)",
      description: "Browser tab and Google. Leave blank to use the display name.",
      type: "localeString",
      group: "seo",
    }),
    defineField({
      name: "seoDescription",
      title: "Meta description (optional override)",
      description: "Snippet under the title in Google. Leave blank to use the short description.",
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
      description: "Shown when this profile's link is shared. Leave blank to use the main photo.",
      type: "image",
      options: { hotspot: true },
      group: "seo",
    }),
    defineField({
      name: "seoNoIndex",
      title: "Hide from search engines",
      description:
        "Keeps the page visible on the site and reachable by link, but asks Google not to index it. Archived profiles stay out of Google either way.",
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

      const publiclyRendered = (PUBLISHED_STATUS.profile as readonly string[]).includes(status);
      if (!publiclyRendered) return true;

      if (status === "active" && !draft?.mainImage) {
        return "An active profile needs at least a main photo.";
      }

      if (draft?.telegramUrl || draft?.whatsappUrl) return true;
      const now = Date.now();
      let settings = siteContactCache && now - siteContactCache.at < SITE_CONTACT_CACHE_MS ? siteContactCache.value : null;
      if (!siteContactCache || now - siteContactCache.at >= SITE_CONTACT_CACHE_MS) {
        settings = await context.getClient({ apiVersion: "2026-01-01" }).fetch<{
          telegramUrl?: string;
          whatsappUrl?: string;
        } | null>(`*[_type == "siteSettings"][0]{ telegramUrl, whatsappUrl }`);
        siteContactCache = { at: now, value: settings };
      }
      if (settings?.telegramUrl || settings?.whatsappUrl) return true;
      return "A published profile needs at least one contact method, either on the profile or as a site-wide default.";
    }),
  preview: {
    select: { title: "displayName", subtitle: "status", media: "mainImage" },
  },
});
