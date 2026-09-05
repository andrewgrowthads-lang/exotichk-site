import { createInterface } from "node:readline/promises";
import { readFileSync } from "node:fs";
import path from "node:path";
import { getCliClient } from "sanity/cli";
import { generateInternalId } from "../src/sanity/lib/generateInternalId";
import { slugifyName } from "../src/sanity/lib/slugifyName";
import { isValidPathSegment } from "../src/lib/slugs";
import { parseProfilesCsv, type CsvRow } from "./profiles-import/csv";
import {
  AGE_MAX,
  AGE_MIN,
  HEIGHT_MAX,
  HEIGHT_MIN,
  isPublicProfileStatus,
  parseBoolean,
  parseLanguages,
  parseOptionalInteger,
  parsePriceHkd,
  parseStatus,
  type ProfileStatus,
} from "./profiles-import/fields";
import { planImages, sha1File } from "./profiles-import/images";
import { resolveCountry, resolveDistrict, type CountryRecord, type DistrictRecord } from "./profiles-import/match";

const API_VERSION = "2026-01-01";

interface Args {
  file: string;
  imagesRoot: string;
  dryRun: boolean;
  yes: boolean;
}

interface PreparedRow {
  rowNumber: number;
  displayName: string;
  slug: string;
  status: ProfileStatus;
  country: CountryRecord;
  district: DistrictRecord;
  age?: number;
  height?: number;
  price?: number;
  nationality?: string;
  languages: string[];
  summaryEn: string;
  descriptionEn?: string;
  featured: boolean;
  sortOrder: number;
  imagePlan: ReturnType<typeof planImages>;
}

type Outcome = "CREATED" | "SKIPPED" | "FAILED" | "TO CREATE";

interface ReportLine {
  outcome: Outcome;
  name: string;
  reason: string;
}

function parseArgs(argv: string[]): Args {
  const separator = argv.indexOf("--");
  const tokens = separator >= 0 ? argv.slice(separator + 1) : argv;
  const args: Partial<Args> = { dryRun: false, yes: false };
  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    if (!token || token === "--with-user-token") continue;
    if (token === "--dry-run") {
      args.dryRun = true;
    } else if (token === "--yes" || token === "-y") {
      args.yes = true;
    } else if (token === "--file") {
      args.file = tokens[++i];
    } else if (token === "--images") {
      args.imagesRoot = tokens[++i];
    } else if (token.startsWith("-")) {
      throw new Error(`Unknown argument: ${token}`);
    }
  }
  if (!args.file) {
    throw new Error("Missing --file path to the CSV (e.g. --file ./imports/profiles.csv)");
  }
  const file = path.resolve(args.file);
  const imagesRoot = path.resolve(args.imagesRoot ?? path.join(path.dirname(file), "profiles"));
  return { file, imagesRoot, dryRun: Boolean(args.dryRun), yes: Boolean(args.yes) };
}

function cell(row: CsvRow, column: string): string {
  return row[column] ?? "";
}

function prepareRow(
  row: CsvRow,
  rowNumber: number,
  imagesRoot: string,
  countries: CountryRecord[],
  districts: DistrictRecord[],
  siteHasContact: boolean,
  seenSlugs: Set<string>,
  existingByKey: Map<string, { displayName: string }>,
): { prepared?: PreparedRow; skip?: ReportLine; fail?: ReportLine } {
  const displayName = cell(row, "display_name").trim();
  if (!displayName) {
    return { fail: { outcome: "FAILED", name: `(row ${rowNumber})`, reason: "display_name is empty" } };
  }

  const errors: string[] = [];
  const slug = slugifyName(displayName);
  if (!slug || !isValidPathSegment(slug)) {
    errors.push(`could not build a valid slug from display_name ${JSON.stringify(displayName)}`);
  }

  const statusResult = parseStatus(cell(row, "status"));
  if (!statusResult.ok) errors.push(statusResult.error);
  const ageResult = parseOptionalInteger(cell(row, "age"), "age", AGE_MIN, AGE_MAX);
  if (!ageResult.ok) errors.push(ageResult.error);
  const heightResult = parseOptionalInteger(cell(row, "height"), "height", HEIGHT_MIN, HEIGHT_MAX);
  if (!heightResult.ok) errors.push(heightResult.error);
  const priceResult = parsePriceHkd(cell(row, "price_hkd"));
  if (!priceResult.ok) errors.push(priceResult.error);
  const featuredResult = parseBoolean(cell(row, "featured"), "featured");
  if (!featuredResult.ok) errors.push(featuredResult.error);
  const sortResult = parseOptionalInteger(cell(row, "sort_order"), "sort_order", Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
  if (!sortResult.ok) errors.push(sortResult.error);

  const summaryEn = cell(row, "summary_en").trim();
  if (!summaryEn) errors.push("summary_en is empty");

  const countryInput = cell(row, "country").trim();
  const districtInput = cell(row, "district").trim();
  const country = resolveCountry(countries, countryInput);
  if (!country) errors.push(`country not found: ${JSON.stringify(countryInput)}`);
  else if (country.status !== "active") errors.push(`country ${country.slug} is ${country.status}, not active`);

  const district = resolveDistrict(districts, districtInput);
  if (!district) errors.push(`district not found: ${JSON.stringify(districtInput)}`);
  else if (district.status !== "active") errors.push(`district ${district.slug} is ${district.status}, not active`);
  else if (country && district.countryId !== country._id) {
    errors.push(`district ${district.slug} does not belong to country ${country.slug}`);
  }

  const status = statusResult.ok ? statusResult.value : "active";
  if (statusResult.ok && isPublicProfileStatus(status) && !siteHasContact) {
    errors.push("Site Settings have no Telegram/WhatsApp, and this import does not set contact overrides");
  }

  const imagePlan = planImages(imagesRoot, cell(row, "image_folder"));
  errors.push(...imagePlan.errors);

  if (slug && seenSlugs.has(`${country?._id ?? ""}:${slug}`)) {
    errors.push(`duplicate slug in this CSV: ${slug}`);
  }
  if (slug && country) seenSlugs.add(`${country._id}:${slug}`);

  if (errors.length > 0) {
    return { fail: { outcome: "FAILED", name: displayName, reason: errors.join("; ") } };
  }

  const key = `${country!._id}:${slug}`;
  const existing = existingByKey.get(key);
  if (existing) {
    return {
      skip: {
        outcome: "SKIPPED",
        name: displayName,
        reason: `already exists as ${existing.displayName} (/${country!.slug}/profiles/${slug}/)`,
      },
    };
  }

  const descriptionEn = cell(row, "description_en").trim();
  const nationality = cell(row, "nationality").trim();

  return {
    prepared: {
      rowNumber,
      displayName,
      slug,
      status,
      country: country!,
      district: district!,
      age: ageResult.ok ? ageResult.value : undefined,
      height: heightResult.ok ? heightResult.value : undefined,
      price: priceResult.ok ? priceResult.value : undefined,
      nationality: nationality || undefined,
      languages: parseLanguages(cell(row, "languages")),
      summaryEn,
      descriptionEn: descriptionEn || undefined,
      featured: featuredResult.ok ? featuredResult.value : false,
      sortOrder: sortResult.ok && sortResult.value !== undefined ? sortResult.value : 0,
      imagePlan,
    },
  };
}

function printSummary(input: {
  found: number;
  valid: number;
  errors: number;
  imagesFound: number;
  existing: number;
  toCreate: number;
  warnings: string[];
  reports: ReportLine[];
}) {
  if (input.warnings.length > 0) {
    for (const warning of input.warnings) console.log(`Warning: ${warning}`);
    console.log("");
  }
  console.log(`Profiles found: ${input.found}`);
  console.log(`Valid: ${input.valid}`);
  console.log(`Errors: ${input.errors}`);
  console.log(`Images found: ${input.imagesFound}`);
  console.log(`Existing profiles: ${input.existing}`);
  console.log(`Profiles to create: ${input.toCreate}`);
  console.log("");
  for (const line of input.reports) {
    console.log(`${line.outcome}\t${line.name}\t${line.reason}`);
  }
}

async function confirmPublish(count: number): Promise<boolean> {
  if (!process.stdin.isTTY) {
    console.error("stdin is not a TTY. Re-run with --yes to publish without a prompt.");
    return false;
  }
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = await rl.question(`\n${count} profile${count === 1 ? "" : "s"} will be published.\nContinue? (y/N) `);
    return /^y(es)?$/i.test(answer.trim());
  } finally {
    rl.close();
  }
}

async function findAssetId(
  client: ReturnType<typeof getCliClient>,
  sha1: string,
): Promise<string | undefined> {
  const id = await client.fetch<string | null>(
    `*[_type == "sanity.imageAsset" && sha1hash == $sha1][0]._id`,
    { sha1 },
  );
  return id ?? undefined;
}

async function uploadOrReuse(
  client: ReturnType<typeof getCliClient>,
  absPath: string,
  filename: string,
): Promise<string> {
  const { buffer, sha1 } = sha1File(absPath);
  const existing = await findAssetId(client, sha1);
  if (existing) return existing;
  const asset = await client.assets.upload("image", buffer, { filename });
  return asset._id;
}

function imageField(assetId: string, altEn: string, key?: string) {
  return {
    _type: "image" as const,
    ...(key ? { _key: key } : {}),
    asset: { _type: "reference" as const, _ref: assetId },
    alt: { _type: "localeString" as const, en: altEn },
  };
}

async function createProfile(
  client: ReturnType<typeof getCliClient>,
  row: PreparedRow,
): Promise<void> {
  const main = row.imagePlan.main;
  if (!main) throw new Error("main image missing after validation");

  const mainAssetId = await uploadOrReuse(client, main.absPath, main.filename);
  const galleryAssetIds: string[] = [];
  for (const item of row.imagePlan.gallery) {
    galleryAssetIds.push(await uploadOrReuse(client, item.absPath, item.filename));
  }

  const doc: { _type: "profile"; [key: string]: unknown } = {
    _type: "profile",
    displayName: row.displayName,
    country: { _type: "reference", _ref: row.country._id },
    district: { _type: "reference", _ref: row.district._id },
    status: row.status,
    slug: { _type: "slug", current: row.slug },
    internalName: generateInternalId(),
    summary: { _type: "localeText", en: row.summaryEn },
    featured: row.featured,
    sortOrder: row.sortOrder,
    mainImage: imageField(mainAssetId, row.displayName),
    gallery: galleryAssetIds.map((assetId, index) =>
      imageField(assetId, row.displayName, `gallery-${String(index + 1).padStart(2, "0")}`),
    ),
    publishedAt: new Date().toISOString(),
    seoNoIndex: false,
  };

  if (row.age !== undefined) doc.age = row.age;
  if (row.height !== undefined) doc.height = row.height;
  if (row.price !== undefined) doc.price = row.price;
  if (row.nationality) doc.nationality = row.nationality;
  if (row.languages.length > 0) doc.languages = row.languages;
  if (row.descriptionEn) doc.body = { _type: "localeText", en: row.descriptionEn };

  await client.create(doc);
}

async function run(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const csvContent = readFileSync(args.file, "utf8");
  const { rows, warnings } = parseProfilesCsv(csvContent);

  const client = getCliClient({ apiVersion: API_VERSION });
  const [countries, districts, existingProfiles, siteSettings] = await Promise.all([
    client.fetch<CountryRecord[]>(
      `*[_type == "country"]{ _id, "slug": slug.current, status, internalName, "titleEn": title.en }`,
    ),
    client.fetch<DistrictRecord[]>(
      `*[_type == "district"]{ _id, "slug": slug.current, status, internalName, "titleEn": title.en, "countryId": country._ref }`,
    ),
    client.fetch<{ _id: string; displayName: string; slug: string; countryId: string }[]>(
      `*[_type == "profile" && defined(slug.current) && defined(country._ref)]{
        _id, displayName, "slug": slug.current, "countryId": country._ref
      }`,
    ),
    client.fetch<{ telegramUrl?: string; whatsappUrl?: string } | null>(
      `*[_type == "siteSettings"][0]{ telegramUrl, whatsappUrl }`,
    ),
  ]);

  const siteHasContact = Boolean(siteSettings?.telegramUrl || siteSettings?.whatsappUrl);
  const existingByKey = new Map(
    existingProfiles.map((profile) => [
      `${profile.countryId}:${profile.slug}`,
      { displayName: profile.displayName },
    ]),
  );

  const seenSlugs = new Set<string>();
  const prepared: PreparedRow[] = [];
  const reports: ReportLine[] = [];
  let imagesFound = 0;

  rows.forEach((row, index) => {
    const result = prepareRow(
      row,
      index + 2,
      args.imagesRoot,
      countries,
      districts,
      siteHasContact,
      seenSlugs,
      existingByKey,
    );
    imagesFound += (result.prepared?.imagePlan ?? planImages(args.imagesRoot, cell(row, "image_folder"))).allCount;
    if (result.fail) reports.push(result.fail);
    else if (result.skip) reports.push(result.skip);
    else if (result.prepared) prepared.push(result.prepared);
  });

  const errors = reports.filter((line) => line.outcome === "FAILED").length;
  const existing = reports.filter((line) => line.outcome === "SKIPPED").length;
  const toCreate = prepared.length;
  const valid = existing + toCreate;

  printSummary({
    found: rows.length,
    valid,
    errors,
    imagesFound,
    existing,
    toCreate,
    warnings,
    reports: [
      ...reports,
      ...prepared.map((row) => ({
        outcome: "TO CREATE" as const,
        name: row.displayName,
        reason: `/${row.country.slug}/profiles/${row.slug}/`,
      })),
    ],
  });

  if (args.dryRun) {
    console.log("\nDry run: no Sanity mutations.");
    return;
  }

  if (toCreate === 0) {
    console.log("\nNothing to create.");
    return;
  }

  if (!args.yes) {
    const ok = await confirmPublish(toCreate);
    if (!ok) {
      console.log("Aborted. No profiles were created.");
      process.exitCode = 1;
      return;
    }
  }

  const finalReport: ReportLine[] = reports.filter((line) => line.outcome !== "CREATED");
  for (const row of prepared) {
    try {
      await createProfile(client, row);
      finalReport.push({
        outcome: "CREATED",
        name: row.displayName,
        reason: `/${row.country.slug}/profiles/${row.slug}/`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown error";
      finalReport.push({
        outcome: "FAILED",
        name: row.displayName,
        reason: `create/upload failed: ${message}`,
      });
    }
  }

  console.log("\n--- import result ---");
  for (const line of finalReport) {
    console.log(`${line.outcome}\t${line.name}\t${line.reason}`);
  }
}

run().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
