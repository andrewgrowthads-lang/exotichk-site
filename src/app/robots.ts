import type { MetadataRoute } from "next";
import { isProductionDeployment } from "@/lib/env";
import { absoluteUrl } from "@/lib/urls";

/**
 * Non-production deployments (previews) disallow everything — a preview
 * URL getting indexed is a real, easy-to-miss SEO defect, and the
 * `X-Robots-Tag` header set in `next.config.ts` backs this up for
 * crawlers that ignore robots.txt.
 */
export default function robots(): MetadataRoute.Robots {
  if (!isProductionDeployment()) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
