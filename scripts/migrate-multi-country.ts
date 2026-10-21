import { getCliClient } from "sanity/cli";

/**
 * One-off, idempotent: prepare the dataset for Hong Kong + Singapore.
 *
 *   Dry run (default, read-only):
 *     npx sanity exec scripts/migrate-multi-country.ts --with-user-token
 *   Apply:
 *     npx sanity exec scripts/migrate-multi-country.ts --with-user-token -- --apply
 *
 * 1. Hong Kong country: set `currency = HKD` if unset, and copy the
 *    legacy site-wide contacts (`siteSettings`) onto it — only when the
 *    Hong Kong document has no contacts of its own yet.
 * 2. Create the Singapore country (`country-singapore`) if no country with
 *    slug `singapore` exists: English only, SGD, NO contacts, no districts.
 *
 * Never deletes, renames or overwrites: every write is `setIfMissing` or
 * `createIfNotExists`, and the Hong Kong patch is guarded by the document
 * revision read during planning. Profiles, districts, slugs, internal IDs
 * and images are not touched. Running it twice is a no-op.
 */
const client = getCliClient({ apiVersion: "2026-01-01" });
const APPLY = process.argv.includes("--apply");

const HONG_KONG_SLUG = "hong-kong";
const SINGAPORE_ID = "country-singapore";
const SINGAPORE_SLUG = "singapore";
const CONTACT_FIELDS = ["whatsappUrl", "telegramUrl", "telegramChannelUrl"] as const;

type ContactField = (typeof CONTACT_FIELDS)[number];
type Contacts = Partial<Record<ContactField, string | null>>;

interface CountryDoc extends Contacts {
  _id: string;
  _rev: string;
  slug?: string;
  currency?: string | null;
}

interface Snapshot {
  hongKong: CountryDoc[];
  singapore: { _id: string; slug?: string }[];
  settings: Contacts | null;
  profilesWithoutCountry: number;
}

function filled(contacts: Contacts | null | undefined): Partial<Record<ContactField, string>> {
  const result: Partial<Record<ContactField, string>> = {};
  for (const field of CONTACT_FIELDS) {
    const value = contacts?.[field]?.trim();
    if (value) result[field] = value;
  }
  return result;
}

async function run() {
  const { projectId, dataset } = client.config();
  console.log(`Project ${projectId}, dataset ${dataset} — ${APPLY ? "APPLY" : "DRY RUN (no writes)"}\n`);

  const snapshot = await client.fetch<Snapshot>(
    `{
      "hongKong": *[_type == "country" && slug.current == $hk]{
        _id, _rev, "slug": slug.current, currency, whatsappUrl, telegramUrl, telegramChannelUrl
      },
      "singapore": *[_type == "country" && (slug.current == $sg || _id in [$sgId, "drafts." + $sgId])]{
        _id, "slug": slug.current
      },
      "settings": *[_id == "siteSettings"][0]{ whatsappUrl, telegramUrl, telegramChannelUrl },
      "profilesWithoutCountry": count(*[_type == "profile" && !defined(country._ref)])
    }`,
    { hk: HONG_KONG_SLUG, sg: SINGAPORE_SLUG, sgId: SINGAPORE_ID },
    { perspective: "raw" },
  );

  if (snapshot.hongKong.length === 0) {
    throw new Error(`No country with slug "${HONG_KONG_SLUG}" found. Aborting without changes.`);
  }
  if (snapshot.profilesWithoutCountry > 0) {
    console.warn(
      `! ${snapshot.profilesWithoutCountry} profile(s) have no country. Not touched — review them in Studio ("All profiles").\n`,
    );
  }

  const legacy = filled(snapshot.settings);
  const transaction = client.transaction();
  let writes = 0;

  // Published document and any open draft get the same fill-in, so a
  // later publish of the draft cannot drop the new values.
  for (const doc of snapshot.hongKong) {
    const set: Record<string, string> = {};
    if (!doc.currency) set.currency = "HKD";
    const own = filled(doc);
    if (Object.keys(own).length === 0) Object.assign(set, legacy);

    console.log(`Hong Kong (${doc._id}):`);
    if (Object.keys(set).length === 0) {
      console.log("  already migrated — currency and contacts present, nothing to do");
      continue;
    }
    for (const [field, value] of Object.entries(set)) console.log(`  set ${field} = ${value}`);
    if (Object.keys(own).length > 0) console.log("  contacts: has its own, left unchanged");
    transaction.patch(doc._id, (patch) => patch.ifRevisionId(doc._rev).setIfMissing(set));
    writes += 1;
  }

  console.log(`\nSingapore (${SINGAPORE_ID}):`);
  if (snapshot.singapore.length > 0) {
    console.log(`  already exists (${snapshot.singapore.map((doc) => doc._id).join(", ")}) — nothing to do`);
  } else {
    const singapore = {
      _id: SINGAPORE_ID,
      _type: "country",
      internalName: "Singapore",
      slug: { _type: "slug", current: SINGAPORE_SLUG },
      title: { _type: "localeString", en: "Singapore" },
      intro: {
        _type: "localeText",
        en: "Private companion profiles in Singapore. Browse by district and contact the local manager directly.",
      },
      currency: "SGD",
      status: "active",
      sortOrder: 1,
    };
    console.log("  create:", JSON.stringify(singapore, null, 2).replace(/\n/g, "\n  "));
    console.log("  contacts: none (add them in Studio → Country settings → Singapore)");
    transaction.createIfNotExists(singapore);
    writes += 1;
  }

  if (writes === 0) {
    console.log("\nNothing to change.");
    return;
  }
  if (!APPLY) {
    console.log(`\nDry run: ${writes} write(s) planned. Re-run with "-- --apply" to execute.`);
    return;
  }
  const result = await transaction.commit({ visibility: "sync" });
  console.log(`\nApplied ${writes} write(s) in transaction ${result.transactionId}.`);
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
