import { defineField, defineType } from "sanity";
import type { FieldDefinition } from "sanity";
import { defaultLocale, locales } from "@/i18n/config";

/**
 * Generates one Sanity field per configured locale. Adding a locale to
 * `i18n/config.ts` makes it appear in every localized object type
 * automatically — no schema file needs to be touched.
 *
 * Non-default locales sit in a collapsed fieldset so daily English
 * editing stays on one screen; Chinese is filled by the translation action.
 */
function localizedFields(fieldType: "string" | "text"): FieldDefinition[] {
  return locales.map((locale) =>
    defineField({
      name: locale.sanityField,
      title: locale.label,
      type: fieldType,
      rows: fieldType === "text" ? 4 : undefined,
      fieldset: locale.isDefault ? undefined : "translated",
      validation: (rule) => (locale.id === defaultLocale.id ? rule.required() : rule),
    }),
  );
}

const translatedFieldset = {
  name: "translated",
  title: "中文",
  options: { collapsible: true, collapsed: true },
};

export const localeString = defineType({
  name: "localeString",
  title: "Localized text",
  type: "object",
  fieldsets: [translatedFieldset],
  fields: localizedFields("string"),
});

export const localeText = defineType({
  name: "localeText",
  title: "Localized paragraph",
  type: "object",
  fieldsets: [translatedFieldset],
  fields: localizedFields("text"),
});
