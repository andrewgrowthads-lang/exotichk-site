import type { SchemaTypeDefinition } from "sanity";
import { localeImage } from "@/sanity/schemaTypes/objects/localeImage";
import { localeString, localeText } from "@/sanity/schemaTypes/objects/localized";
import { country } from "@/sanity/schemaTypes/documents/country";
import { district } from "@/sanity/schemaTypes/documents/district";
import { profile } from "@/sanity/schemaTypes/documents/profile";
import { siteSettings } from "@/sanity/schemaTypes/documents/siteSettings";

export const schemaTypes: SchemaTypeDefinition[] = [
  localeString,
  localeText,
  localeImage,
  siteSettings,
  country,
  district,
  profile,
];
