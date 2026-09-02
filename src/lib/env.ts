/**
 * Central, validated access to environment variables. Nothing in this
 * file is `NEXT_PUBLIC_*` unless it is genuinely safe to ship to the
 * browser (project id, dataset name, API version — no tokens, no
 * secrets).
 */

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (explicit) return explicit;
  const vercelHost = process.env.VERCEL_URL?.replace(/\/$/, "");
  if (vercelHost) return `https://${vercelHost}`;
  throw new Error("Missing required environment variable: NEXT_PUBLIC_SITE_URL");
}

export const env = {
  siteUrl: resolveSiteUrl(),
  sanityProjectId: required(
    "NEXT_PUBLIC_SANITY_PROJECT_ID",
    process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  ),
  sanityDataset: required("NEXT_PUBLIC_SANITY_DATASET", process.env.NEXT_PUBLIC_SANITY_DATASET),
  sanityApiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2026-01-01",
  /** Server-only read token for the private dataset. Never exposed to the client. */
  sanityReadToken: process.env.SANITY_READ_TOKEN,
  /** Server-only secret used to authenticate the Sanity webhook. */
  revalidateSecret: process.env.SANITY_REVALIDATE_SECRET,
} as const;

export function isProductionDeployment(): boolean {
  return process.env.VERCEL_ENV === "production";
}
