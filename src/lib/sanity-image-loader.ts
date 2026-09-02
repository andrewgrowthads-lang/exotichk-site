/**
 * `next/image` custom loader that requests transforms directly from the
 * Sanity CDN instead of proxying through Vercel's image optimizer.
 * Sanity already resizes, re-encodes and serves these assets from its own
 * edge cache, so a second optimization layer only adds a hop, a second
 * cold cache, and Vercel image-transformation quota for no benefit.
 *
 * Wired up in `next.config.ts` via `images.loader: "custom"`.
 */
export default function sanityImageLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  const url = new URL(src);
  url.searchParams.set("w", String(width));
  url.searchParams.set("q", String(quality ?? 75));
  url.searchParams.set("fit", "max");
  url.searchParams.set("auto", "format");
  return url.toString();
}
