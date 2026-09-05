/**
 * Hosted Studio is a static bundle on sanity.studio. It cannot call
 * localhost: the editor's browser is on another machine, and HTTPS pages
 * cannot fetch http://. Keep SANITY_STUDIO_SITE_URL for local `sanity dev`
 * and SANITY_STUDIO_PUBLIC_SITE_URL (HTTPS Next.js origin) for deploy.
 */

function trimOrigin(value: string | undefined): string {
  return value?.trim().replace(/\/$/, "") ?? "";
}

export function isHostedSanityStudio(hostname: string): boolean {
  return hostname === "sanity.studio" || hostname.endsWith(".sanity.studio");
}

export function studioTranslateOrigin(options?: {
  hostname?: string;
  localUrl?: string;
  publicUrl?: string;
}): string {
  const local = trimOrigin(options?.localUrl ?? process.env.SANITY_STUDIO_SITE_URL) || "http://localhost:3000";
  const published = trimOrigin(options?.publicUrl ?? process.env.SANITY_STUDIO_PUBLIC_SITE_URL);
  const hostname = options?.hostname ?? (typeof window !== "undefined" ? window.location.hostname : "");
  if (isHostedSanityStudio(hostname) && published) return published;
  return local;
}

export function translateApiUrl(origin: string): string {
  return `${origin.replace(/\/$/, "")}/api/translate/`;
}

export function revalidateApiUrl(origin: string): string {
  return `${origin.replace(/\/$/, "")}/api/revalidate/`;
}

export function canHostedStudioReach(origin: string, hostname?: string): boolean {
  const host = hostname ?? (typeof window !== "undefined" ? window.location.hostname : "");
  if (!isHostedSanityStudio(host)) return true;
  try {
    const url = new URL(origin);
    if (url.protocol !== "https:") return false;
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") return false;
    return true;
  } catch {
    return false;
  }
}
