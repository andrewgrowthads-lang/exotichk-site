/**
 * `next/image` custom loader for Sanity assets.
 *
 * Remote Sanity asset URLs get resize/format params appended and are
 * served straight from Sanity's CDN. Routing them through Vercel's
 * optimizer too would add a second hop, a second cold cache, and
 * Vercel image-transformation quota for no benefit — Sanity already
 * does this job.
 *
 * Wired up in `next.config.ts` via `images.loader: "custom"`.
 */
export default function imageLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  const url = new URL(src);
  if (url.protocol !== "https:" || url.hostname !== "cdn.sanity.io" || !url.pathname.startsWith("/images/")) {
    throw new Error("Unsupported image source.");
  }
  url.searchParams.set("w", String(width));
  url.searchParams.set("q", String(quality ?? 75));
  url.searchParams.set("fit", "max");
  url.searchParams.set("auto", "format");
  return url.toString();
}
