export const TRANSLATABLE_FIELDS = ["summary", "body", "seoTitle", "seoDescription"] as const;

export type TranslatableField = (typeof TRANSLATABLE_FIELDS)[number];

export const TRANSLATION_MAX_FIELD_CHARS = 4_000;
export const TRANSLATION_MAX_BODY_BYTES = 20_000;
