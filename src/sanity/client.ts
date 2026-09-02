import { createClient } from "@sanity/client";
import { env } from "@/lib/env";

/**
 * Server-only client for public catalog pages.
 *
 * `useCdn: false` and `perspective: "published"` are deliberate: reading
 * through Sanity's CDN would race with the revalidation webhook — the
 * webhook can arrive before the CDN cache updates, causing a page to
 * regenerate with stale content and then stay stale for a full ISR
 * cycle. At 50-100 documents, the extra load on the live API is
 * negligible.
 */
export const sanityClient = createClient({
  projectId: env.sanityProjectId,
  dataset: env.sanityDataset,
  apiVersion: env.sanityApiVersion,
  token: env.sanityReadToken,
  useCdn: false,
  perspective: "published",
});
