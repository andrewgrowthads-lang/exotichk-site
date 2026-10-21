import { defineField, defineType } from "sanity";
import { resolveCountryContact } from "@/lib/contact";
import { PUBLISHED_STATUS } from "@/lib/visibility";
import { EnglishTextInput } from "@/sanity/components/EnglishTextInput";
import { PriceInput } from "@/sanity/components/PriceInput";
import { ProfileDocumentInput } from "@/sanity/components/ProfileDocumentInput";
import { generateInternalId } from "@/sanity/lib/generateInternalId";
import { validateContactUrl } from "@/sanity/schemaTypes/validators/contactUrl";
import { districtBelongsToCountry } from "@/sanity/schemaTypes/validators/districtBelongsToCountry";
import { districtRequiredByCountry } from "@/sanity/schemaTypes/validators/districtRequiredByCountry";
import { immutableInternalName } from "@/sanity/schemaTypes/validators/immutableInternalName";
import { immutablePublishedCountry } from "@/sanity/schemaTypes/validators/immutablePublishedCountry";
import type { ContactLinks } from "@/types/content";
import { immutablePublishedSlug } from "@/sanity/schemaTypes/validators/immutablePublishedSlug";
import { uniqueInternalName } from "@/sanity/schemaTypes/validators/uniqueInternalName";
import {
  slugIsUniqueWithinCountry,
  uniqueSlugWithinCountry,
} from "@/sanity/schemaTypes/validators/uniqueSlugWithinCountry";

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

const countryContactCache = new Map<string, { at: number; value: ContactLinks }>();
const CONTACT_CACHE_MS = 5_000;

const hidden = true;

export const profile = defineType({
  name: "profile",
  title: "Profile",
  type: "document",
  components: { input: ProfileDocumentInput },
  fields: [
    defineField({
      name: "country",
      title: "Country",
      description: "Sets the districts, currency and contact buttons. Cannot be changed after publishing.",
      type: "reference",
      to: [{ type: "country" }],
      options: { disableNew: true, filter: 'status == "active"' },
      validation: (rule) => immutablePublishedCountry()(rule.required()),
    }),
    defineField({
      name: "displayName",
      title: "Name",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "district",
      title: "District",
      description: "Only districts of the selected country are listed. Not used for countries without districts.",
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
      validation: (rule) => districtBelongsToCountry()(districtRequiredByCountry()(rule)),
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
      title: "Price",
      description: "Numbers only, e.g. 1500. Shown in the country's currency (HK$ or S$).",
      type: "number",
      components: { input: PriceInput },
      validation: (rule) => rule.integer().min(1).max(999999),
    }),
    defineField({
      name: "body",
      title: "Description",
      type: "localeText",
      components: { input: EnglishTextInput },
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
      initialValue: () => generateInternalId(),
      validation: (rule) => immutableInternalName()(uniqueInternalName()(rule.required())),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      hidden,
      options: {
        source: "displayName",
        maxLength: 64,
        isUnique: slugIsUniqueWithinCountry("profile"),
      },
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
      title: "Telegram (overrides country default)",
      type: "url",
      hidden,
      validation: validateContactUrl("telegram"),
    }),
    defineField({
      name: "whatsappUrl",
      title: "WhatsApp (overrides country default)",
      type: "url",
      hidden,
      validation: validateContactUrl("whatsapp"),
    }),
    defineField({
      name: "telegramChannelUrl",
      title: "Telegram channel (overrides country default)",
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
  validation: (rule) => [
    rule.custom((document) => {
      const draft = document as ProfileDraft | undefined;
      if (draft?.status === "active" && !draft?.mainImage) {
        return "Add at least one photo before publishing.";
      }
      return true;
    }),
    // A missing contact only hides the button on the site, so it warns
    // rather than blocks: Singapore profiles may go live before its
    // manager links are set up.
    rule
      .custom(async (document, context) => {
        const draft = document as ProfileDraft | undefined;
        const status = draft?.status;
        if (!status || !(PUBLISHED_STATUS.profile as readonly string[]).includes(status)) return true;
        if (draft?.telegramUrl || draft?.whatsappUrl) return true;
        const countryId = draft?.country?._ref;
        if (!countryId) return true;

        const now = Date.now();
        const cached = countryContactCache.get(countryId);
        let contact = cached && now - cached.at < CONTACT_CACHE_MS ? cached.value : undefined;
        if (contact === undefined) {
          const result = await context.getClient({ apiVersion: "2026-01-01" }).fetch<{
            country: { slug?: string; contact?: ContactLinks } | null;
            legacy: ContactLinks | null;
          }>(
            `{
              "country": *[_id == $countryId][0]{
                "slug": slug.current,
                "contact": { telegramUrl, whatsappUrl, telegramChannelUrl }
              },
              "legacy": *[_type == "siteSettings"][0]{ telegramUrl, whatsappUrl, telegramChannelUrl }
            }`,
            { countryId },
          );
          const country = result.country;
          contact = country?.slug
            ? resolveCountryContact({ slug: country.slug, contact: country.contact }, result.legacy ?? undefined)
            : {};
          countryContactCache.set(countryId, { at: now, value: contact });
        }
        if (contact.telegramUrl || contact.whatsappUrl) return true;
        return "This country has no WhatsApp or Telegram manager yet, so no contact button will be shown. Add them under Country settings.";
      })
      .warning(),
  ],
  preview: {
    select: {
      title: "displayName",
      status: "status",
      country: "country.title.en",
      district: "district.title.en",
      internalName: "internalName",
      media: "mainImage",
    },
    prepare: ({ title, status, country, district, internalName, media }) => {
      const statusLabel = STATUS_OPTIONS.find((option) => option.value === status)?.title ?? status;
      return {
        title: title || "Untitled",
        subtitle: [internalName, country, district, statusLabel].filter(Boolean).join(" · "),
        media,
      };
    },
  },
});
