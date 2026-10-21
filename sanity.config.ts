import { defineConfig, type InitialValueResolverContext } from "sanity";
import { structureTool, type StructureBuilder } from "sanity/structure";
import { ArchiveRestoreProfileAction } from "@/sanity/actions/archiveProfile";
import { GenerateChineseAction } from "@/sanity/actions/generateChinese";
import { PublishAndRefreshAction } from "@/sanity/actions/publishAndRefresh";
import { PublishEnglishOnlyAction, PublishProfileAction } from "@/sanity/actions/publishProfile";
import { generateInternalId } from "@/sanity/lib/generateInternalId";
import { schemaTypes } from "@/sanity/schemaTypes";

const API_VERSION = "2026-01-01";
const REFRESH_ON_PUBLISH = new Set(["country", "district", "siteSettings"]);

interface CountryParams {
  countryId?: string;
}

const countryReference = (countryId: string) => ({ _type: "reference", _ref: countryId });

/**
 * One entry per country, each opening only that country's documents. New
 * documents created from here get the country pre-filled through the
 * `*-in-country` templates below.
 */
function byCountry(S: StructureBuilder, type: "profile" | "district", title: string) {
  return S.listItem()
    .title(title)
    .id(`${type}-by-country`)
    .child(
      S.documentTypeList("country")
        .title(title)
        .filter(
          type === "district"
            ? '_type == "country" && status == "active" && useDistricts != false'
            : '_type == "country" && status == "active"',
        )
        .defaultOrdering([{ field: "sortOrder", direction: "asc" }])
        .initialValueTemplates([])
        .child((countryId) =>
          S.documentList()
            .id(`${type}-in-${countryId}`)
            .title(type === "profile" ? "Profiles" : "Districts")
            .schemaType(type)
            .apiVersion(API_VERSION)
            .filter("_type == $type && country._ref == $countryId")
            .params({ type, countryId })
            .defaultOrdering([{ field: "sortOrder", direction: "asc" }])
            .initialValueTemplates([S.initialValueTemplateItem(`${type}-in-country`, { countryId })]),
        ),
    );
}

/**
 * Sanity Studio. Deployed separately (`npm run sanity:deploy`) to
 * Sanity's own hosting — it is not part of the Next.js app or the
 * Vercel deployment, and is not served from the production domain.
 *
 * The Studio's bundler (Vite, via the Sanity CLI) only exposes
 * environment variables prefixed `SANITY_STUDIO_`, which is why these
 * are separate from the app's `NEXT_PUBLIC_SANITY_*` variables even
 * though they hold the same values. See `.env.example`.
 */
export default defineConfig({
  name: "default",
  title: "ExoticHK",
  projectId: process.env.SANITY_STUDIO_PROJECT_ID ?? "",
  dataset: process.env.SANITY_STUDIO_DATASET ?? "production",
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title("Content")
          .items([
            byCountry(S, "profile", "Profiles"),
            byCountry(S, "district", "Districts"),
            S.listItem()
              .title("Country settings")
              .id("country-settings")
              .child(
                S.documentTypeList("country")
                  .title("Country settings")
                  .defaultOrdering([{ field: "sortOrder", direction: "asc" }]),
              ),
            S.listItem()
              .title("Site settings")
              .id("siteSettings")
              .child(S.document().schemaType("siteSettings").documentId("siteSettings")),
            S.divider(),
            S.documentTypeListItem("profile").title("All profiles"),
            S.documentTypeListItem("district").title("All districts"),
          ]),
    }),
  ],
  schema: {
    types: schemaTypes,
    templates: (previous) => [
      ...previous,
      {
        id: "profile-in-country",
        title: "Profile",
        schemaType: "profile",
        parameters: [{ name: "countryId", type: "string" }],
        value: async (params: CountryParams | undefined, context: InitialValueResolverContext) => {
          if (!params?.countryId) return {};
          const slug = await context
            .getClient({ apiVersion: API_VERSION })
            .fetch<string | null>(`*[_id == $id][0].slug.current`, { id: params.countryId });
          return {
            country: countryReference(params.countryId),
            internalName: generateInternalId(slug ?? undefined),
          };
        },
      },
      {
        id: "district-in-country",
        title: "District",
        schemaType: "district",
        parameters: [{ name: "countryId", type: "string" }],
        value: (params: CountryParams | undefined) =>
          params?.countryId ? { country: countryReference(params.countryId) } : {},
      },
    ],
  },
  document: {
    newDocumentOptions: (previous, { creationContext }) =>
      creationContext.type === "global"
        ? previous.filter(
            (item) =>
              item.templateId !== "siteSettings" &&
              item.templateId !== "profile-in-country" &&
              item.templateId !== "district-in-country",
          )
        : previous,
    actions: (previous, context) => {
      if (REFRESH_ON_PUBLISH.has(context.schemaType)) {
        return previous.map((action) => (action.action === "publish" ? PublishAndRefreshAction : action));
      }
      if (context.schemaType !== "profile") return previous;
      const rest = previous.filter((action) => action.action !== "publish");
      return [
        ArchiveRestoreProfileAction,
        PublishProfileAction,
        PublishEnglishOnlyAction,
        GenerateChineseAction,
        ...rest,
      ];
    },
  },
});
