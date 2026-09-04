import { getCliClient } from "sanity/cli";

/**
 * One-off: introduce TST without renaming the published `central` slug.
 * Run: npx sanity exec scripts/migrate-tst.ts --with-user-token
 */
const client = getCliClient({ apiVersion: "2026-01-01" });

const COUNTRY_ID = "country-hong-kong";
const CENTRAL_ID = "district-central";
const TST_ID = "district-tst";
const LILY_ID = "309489d6-0688-4deb-869a-cbf86935a09d";

async function run() {
  const existing = await client.fetch<{ _id: string; slug?: string } | null>(
    `*[_id == $id][0]{ _id, "slug": slug.current }`,
    { id: TST_ID },
  );

  if (!existing) {
    await client.create({
      _id: TST_ID,
      _type: "district",
      internalName: "TST (Tsim Sha Tsui)",
      country: { _type: "reference", _ref: COUNTRY_ID },
      slug: { _type: "slug", current: "tst" },
      title: { _type: "localeString", en: "TST", zhHantHK: "尖沙咀" },
      intro: {
        _type: "localeText",
        en: "Profiles currently listed in TST (Tsim Sha Tsui).",
        zhHantHK: "目前列於尖沙咀（TST）的檔案。",
      },
      status: "active",
      sortOrder: 0,
    });
    console.log("Created district-tst");
  } else {
    console.log(`district-tst already exists (slug=${existing.slug})`);
  }

  await client
    .patch(LILY_ID)
    .set({ district: { _type: "reference", _ref: TST_ID } })
    .commit();
  console.log("Moved Lily to TST");

  await client.patch(CENTRAL_ID).set({ status: "archived" }).commit();
  console.log("Archived district-central");

  await client.patch("district-wan-chai").set({ sortOrder: 1 }).commit();
  console.log("Set Wan Chai sortOrder=1");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
