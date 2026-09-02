import type { NextConfig } from "next";

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
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' https://cdn.sanity.io data:",
  "font-src 'self' data:",
  "connect-src 'self' https://vitals.vercel-insights.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  trailingSlash: true,
  images: {
    // Sanity's own CDN already resizes and re-encodes these assets;
    // routing them through Vercel's optimizer too would add a hop, a
    // second cold cache, and image-transformation quota for no benefit.
    loader: "custom",
    loaderFile: "./src/lib/sanity-image-loader.ts",
  },
  async headers() {
    const baseHeaders = [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
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
