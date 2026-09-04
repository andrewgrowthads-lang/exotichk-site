/**
 * Deliberately browser-safe configuration. This module must never gain a
 * token, secret, private URL, or credential. It is the only environment
 * module that client components may import (indirectly via image helpers).
 */
function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required public environment variable: ${name}`);
  }
  return value;
}

export const publicEnv = {
  sanityProjectId: required(
    "NEXT_PUBLIC_SANITY_PROJECT_ID",
    process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  ),
  sanityDataset: required("NEXT_PUBLIC_SANITY_DATASET", process.env.NEXT_PUBLIC_SANITY_DATASET),
} as const;
