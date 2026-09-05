import { canHostedStudioReach, revalidateApiUrl, studioTranslateOrigin } from "@/sanity/lib/studioSiteUrl";

/** Best-effort: publish already succeeded if this fails. */
export function scheduleCatalogRevalidate(token: string): void {
  window.setTimeout(() => {
    void requestCatalogRevalidate(token);
  }, 1200);
}

async function requestCatalogRevalidate(token: string): Promise<void> {
  const origin = studioTranslateOrigin();
  if (!canHostedStudioReach(origin)) return;
  try {
    await fetch(revalidateApiUrl(origin), {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    // Catalog will catch up on the next ISR window.
  }
}
