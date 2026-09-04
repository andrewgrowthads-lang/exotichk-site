import "server-only";
import { publicEnv } from "@/lib/publicEnv";

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

const production = process.env.VERCEL_ENV === "production";

function requiredInProduction(name: string, value: string | undefined): string | undefined {
  return production ? required(name, value) : value;
}

function secret(name: string, value: string | undefined): string | undefined {
  const configured = requiredInProduction(name, value);
  if (configured && configured.length < 32) {
    throw new Error(`${name} must contain at least 32 characters.`);
  }
  return configured;
}

function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  const value =
    (production ? required("NEXT_PUBLIC_SITE_URL", explicit) : explicit) ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL.replace(/\/$/, "")}` : "");
  if (!value) {
    throw new Error("Missing required environment variable: NEXT_PUBLIC_SITE_URL");
  }

  const url = new URL(value);
  if (url.pathname !== "/" || url.search || url.hash) {
    throw new Error("NEXT_PUBLIC_SITE_URL must be an origin without a path, query, or fragment.");
  }
  if (production && url.protocol !== "https:") {
    throw new Error("NEXT_PUBLIC_SITE_URL must use https:// in production.");
  }
  return url.origin;
}

export const env = {
  siteUrl: resolveSiteUrl(),
  sanityProjectId: publicEnv.sanityProjectId,
  sanityDataset: publicEnv.sanityDataset,
  sanityApiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2026-01-01",
  /** Server-only Viewer token for the private dataset. Never exposed to the client. */
  sanityReadToken: required("SANITY_READ_TOKEN", process.env.SANITY_READ_TOKEN),
  /** Server-only secret used to authenticate the Sanity webhook. */
  revalidateSecret: secret("SANITY_REVALIDATE_SECRET", process.env.SANITY_REVALIDATE_SECRET),
} as const;

export function isProductionDeployment(): boolean {
  return production;
}
