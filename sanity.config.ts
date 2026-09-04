import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { GenerateChineseAction } from "@/sanity/actions/generateChinese";
import { schemaTypes } from "@/sanity/schemaTypes";

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
            S.listItem()
              .title("Site settings")
              .id("siteSettings")
              .child(S.document().schemaType("siteSettings").documentId("siteSettings")),
            S.divider(),
            ...S.documentTypeListItems().filter((item) => item.getId() !== "siteSettings"),
          ]),
    }),
  ],
  schema: {
    types: schemaTypes,
  },
  document: {
    actions: (previous, context) =>
      context.schemaType === "profile" ? [GenerateChineseAction, ...previous] : previous,
  },
});
