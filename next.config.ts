import type { NextConfig } from "next";
import { permanentRedirects } from "./src/lib/permanentRedirects";

const isProductionDeployment = process.env.VERCEL_ENV === "production";

/**
 * Static CSP, no nonce. A nonce-based CSP requires middleware to mint a
 * per-request value, which forces every route into dynamic rendering —
 * that would undo the static generation this whole catalog depends on
 * for Core Web Vitals. `'unsafe-inline'` for scripts is a deliberate,
 * documented trade-off (see docs/ARCHITECTURE.md §13), not an oversight.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "script-src-attr 'none'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' https://cdn.sanity.io data:",
  "font-src 'self' data:",
  "connect-src 'self' https://vitals.vercel-insights.com",
  "object-src 'none'",
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "manifest-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  ...(isProductionDeployment ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value:
      "accelerometer=(), autoplay=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  { key: "Origin-Agent-Cluster", value: "?1" },
];

const noIndexHeader = { key: "X-Robots-Tag", value: "noindex, follow, noarchive" };
const queryOnlyParameters = ["q", "search", "filter", "sort", "page"];

const nextConfig: NextConfig = {
  trailingSlash: true,
  agentRules: false,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  images: {
    // Sanity's own CDN already resizes and re-encodes remote assets;
    // routing them through Vercel's optimizer too would add a hop, a
    // second cold cache, and image-transformation quota for no benefit.
    // Unsupported/non-Sanity image origins are rejected by the loader.
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
  },
  async redirects() {
    return permanentRedirects.map(({ source, destination }) => ({
      source,
      destination,
      statusCode: 301 as const,
    }));
  },
  async headers() {
    const baseHeaders = [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/api/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
          { key: "Cache-Control", value: "no-store" },
        ],
      },
      ...queryOnlyParameters.map((key) => ({
        source: "/:path*",
        has: [{ type: "query" as const, key }],
        headers: [noIndexHeader],
      })),
    ];

    if (isProductionDeployment) {
      return baseHeaders;
    }

    // Preview and other non-production deployments must never be indexed.
    return [
      ...baseHeaders,
      {
        source: "/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
