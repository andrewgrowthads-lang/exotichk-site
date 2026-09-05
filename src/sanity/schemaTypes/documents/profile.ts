import { defineField, defineType } from "sanity";
import { PUBLISHED_STATUS } from "@/lib/visibility";
import { EnglishTextInput } from "@/sanity/components/EnglishTextInput";
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
  country?: { _ref?: string };
}

const STATUS_OPTIONS = [
  { title: "Active", value: "active" },
  { title: "Temporarily unavailable", value: "temporarilyUnavailable" },
  { title: "Archived", value: "archived" },
];

let siteContactCache: { at: number; value: { telegramUrl?: string; whatsappUrl?: string } | null } | null =
  null;
const SITE_CONTACT_CACHE_MS = 5_000;

const hidden = true;

export const profile = defineType({
  name: "profile",
  title: "Profile",
  type: "document",
  components: { input: ProfileDocumentInput },
  fields: [
    defineField({
      name: "displayName",
      title: "Name",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "district",
      title: "District",
      type: "reference",
      to: [{ type: "district" }],
      options: {
        disableNew: true,
        filter: ({ document }) => {
          const countryId = (document as ProfileDraft).country?._ref;
          if (!countryId) {
            return { filter: "_id == $none", params: { none: "none" } };
          }
          return {
            filter: "country._ref == $countryId && status == \"active\"",
            params: { countryId },
          };
        },
      },
      validation: (rule) => districtBelongsToCountry()(rule.required()),
    }),
    defineField({
      name: "age",
      title: "Age",
      type: "number",
      validation: (rule) => rule.integer().min(18).max(99),
    }),
    defineField({
      name: "height",
      title: "Height",
      type: "number",
      description: "Centimetres.",
      validation: (rule) => rule.integer().min(100).max(220),
    }),
    defineField({
      name: "nationality",
      title: "Nationality",
      type: "string",
    }),
    defineField({
      name: "languages",
      title: "Languages",
      type: "array",
      of: [{ type: "string" }],
      options: { layout: "tags" },
    }),
    defineField({
      name: "price",
      title: "Price (HKD)",
      description: "Numbers only, e.g. 1500.",
      type: "number",
      validation: (rule) => rule.integer().min(1).max(999999),
    }),
    defineField({
      name: "body",
      title: "Description",
      type: "localeText",
      components: { input: EnglishTextInput },
    }),

    defineField({
      name: "country",
      title: "Country",
      type: "reference",
      to: [{ type: "country" }],
      hidden,
      initialValue: async (_, context) => {
        const id = await context.getClient({ apiVersion: "2026-01-01" }).fetch<string | null>(
          `*[_type == "country" && slug.current == "hong-kong"][0]._id`,
        );
        return { _ref: id || "country-hong-kong" };
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      options: { list: STATUS_OPTIONS, layout: "radio" },
      initialValue: "active",
      hidden,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "mainImage",
      title: "Main photo",
      type: "localeImage",
      hidden,
    }),
    defineField({
      name: "gallery",
      title: "Gallery",
      type: "array",
      of: [{ type: "localeImage" }],
      hidden,
      validation: (rule) => rule.max(11),
    }),
    defineField({
      name: "summary",
      title: "English summary",
      type: "localeText",
      hidden,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "internalName",
      title: "Internal ID",
      type: "string",
      hidden,
      readOnly: true,
      initialValue: generateInternalId,
      validation: (rule) => immutableInternalName()(uniqueInternalName()(rule.required())),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      hidden,
      options: { source: "displayName", maxLength: 64 },
      validation: (rule) =>
        immutablePublishedSlug()(uniqueSlugWithinCountry("profile")(rule.required())),
    }),
    defineField({
      name: "featured",
      title: "Featured",
      type: "boolean",
      hidden,
      initialValue: false,
    }),
    defineField({
      name: "sortOrder",
      title: "Sort order",
      type: "number",
      hidden,
      initialValue: 0,
    }),
    defineField({
      name: "attributes",
      title: "Additional characteristics",
      type: "array",
      of: [{ type: "string" }],
      hidden,
      options: { layout: "tags" },
    }),
    defineField({
      name: "publishedAt",
      title: "Published at",
      type: "datetime",
      hidden,
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: "translationMeta",
      title: "Translation metadata",
      type: "object",
      hidden,
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
      type: "url",
      hidden,
      validation: validateContactUrl("telegram"),
    }),
    defineField({
      name: "whatsappUrl",
      title: "WhatsApp (overrides site default)",
      type: "url",
      hidden,
      validation: validateContactUrl("whatsapp"),
    }),
    defineField({
      name: "telegramChannelUrl",
      title: "Telegram channel (overrides site default)",
      type: "url",
      hidden,
      validation: validateContactUrl("telegramChannel"),
    }),
    defineField({
      name: "unavailableMessage",
      title: "Unavailable message",
      type: "localeText",
      hidden,
    }),
    defineField({
      name: "seoTitle",
      title: "SEO title (optional override)",
      type: "localeString",
      hidden,
    }),
    defineField({
      name: "seoDescription",
      title: "Meta description (optional override)",
      type: "localeText",
      hidden,
    }),
    defineField({
      name: "h1Override",
      title: "H1 override (optional)",
      type: "localeString",
      hidden,
    }),
    defineField({
      name: "ogImage",
      title: "Social share image (optional)",
      type: "image",
      hidden,
      options: { hotspot: true },
    }),
    defineField({
      name: "seoNoIndex",
      title: "Hide from search engines",
      type: "boolean",
      hidden,
      initialValue: false,
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
        return "Add at least one photo before publishing.";
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
