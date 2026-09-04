# Technical SEO audit

Audit date: 2026-09-03  
Scope: all public App Router routes, metadata, Sanity visibility rules, sitemap, robots, JSON-LD, redirects, query parameters, and production HTTP behavior.

## Outcome

The implementation now meets the requested technical controls in code. Production build, rendered HTML, response headers, localized sitemap output, and profile lifecycle behavior were verified against a local production server. No artificial SEO pages, translated slugs, keyword variants, review markup, or client-only SEO were introduced.

## Problems found and fixed

1. The sitemap emitted only the default locale as `<loc>`. Chinese canonical pages appeared only as alternates, rather than as first-class sitemap entries. It now emits one row per visible canonical locale with a complete reciprocal `en` / `zh-Hant` / `x-default` set.
2. Homepage and country pages shared the same fallback title and description. Route-specific, localized fallback templates now keep homepage, country, district, and profile metadata distinct without keyword repetition.
3. Breadcrumb requirements existed in documentation but were not rendered by Country, District, or Profile views. All internal pages now have visible semantic breadcrumbs and matching `BreadcrumbList` JSON-LD with absolute URLs.
4. District intro content was used as metadata but not rendered on the district page, making district pages unnecessarily thin. It is now rendered below the listing.
5. Open Graph lacked explicit locale/type and had no Twitter-card equivalent or image alt. The centralized metadata builder now emits these consistently and uses the configured fallback social image when an entity image is absent.
6. Public dynamic route parameters reached Sanity before syntax validation. Invalid country/district/profile path segments now return 404 without a CMS query.
7. Technical API URLs were blocked in robots.txt but did not carry an indexing header. `/api/*` now returns `X-Robots-Tag: noindex, nofollow, noarchive`.
8. Functional query variants had a clean canonical but no explicit non-indexing signal. Known functional parameters (`q`, `search`, `filter`, `sort`, `page`) now receive `X-Robots-Tag: noindex, follow, noarchive`. UTM parameters remain allowed and canonicalize to the clean path.
9. Slug migration was documented only as an informal edit to `next.config.ts`. A dedicated, code-reviewed `src/lib/permanentRedirects.ts` ledger now produces exact HTTP 301 redirects. No entries were added because there are no known legacy URLs.
10. Organization structured data used the current locale homepage as the organization identity. It now uses the stable English root; each locale separately emits its own `WebSite` node.
11. Homepage and country URLs rendered the same listing under separate self-canonicals. Both must remain indexable by requirement, so their roles are now distinct: homepage is a brand/navigation hub with featured profiles; country is the complete catalogue.
12. Country and District `body` fields existed in Sanity but were neither queried nor rendered. They are now projected and rendered when populated.
13. Locale-incomplete documents were excluded at runtime but still entered locale route `generateStaticParams`. Static parameter generation now uses the same locale and parent-visibility rules as pages and sitemap.
14. Open Graph advertised every configured alternate locale, including translations that returned 404. It now derives `alternateLocale` only from visible page alternates and uses `en_HK` / `zh_HK`.
15. Temporarily unavailable profiles fetched an editor message but did not render it and could sort ahead of Active profiles. The profile now shows a localized notice while retaining manager CTAs, and Active profiles sort first.
16. Country/District “All” links pointed to the homepage, weakening the separate country catalogue cluster. They now point to the country canonical.
17. Locale 404 pages relied only on HTTP status for indexing control. They now include localized titles and explicit `noindex, nofollow`.
18. Site Settings brand/default SEO fields were fetched but unused. Homepage metadata and Organization JSON-LD now consume them; entity pages keep unique entity-specific fallbacks.

## Controls verified

- Public homepage, country, district, and profile content is server-rendered/static HTML.
- Every tested 200 page has one title, one meta description, one H1, a self-canonical without query parameters, reciprocal hreflang, Open Graph, and explicit robots rules.
- English and Traditional Chinese use separate self-canonical URLs.
- Unknown slugs return 404. Technical GET on the revalidation endpoint returns 405.
- Active profile test: both locale pages returned 200, appeared once each in sitemap, and had correct metadata and breadcrumbs.
- Archived profile test: the former URL returned 404 and disappeared from sitemap.
- UTM test: `?utm_source=...` returned 200 while canonical remained the clean URL.
- Functional query test: `?filter=...` and `?q=...` returned the noindex response header.
- Preview/staging policy: non-production builds return global `X-Robots-Tag: noindex, nofollow`; non-production robots.txt disallows crawling.
- Production robots.txt allows the public catalogue, disallows `/api/`, and points to sitemap.xml.
- Sitemap contains only visible, indexable canonical pages and excludes `seoNoIndex`, Draft, Archived, and incomplete locale variants.

## Remaining deployment/content actions

- Production must set `NEXT_PUBLIC_SITE_URL` to the final canonical HTTPS origin. The local value is `http://localhost:3000`, so the live domain cannot be validated from this workspace.
- `src/lib/permanentRedirects.ts` is intentionally empty. Before any published slug changes, add old-to-new mappings for every locale; country slug changes also require mappings for descendant district/profile URLs.
- The current Sanity dataset has no profiles or image assets, and Site Settings has no default social image/logo. Metadata is valid, but social cards are text-only until an editor uploads these assets.
- Site Settings still contains the placeholder agency description “Test agency” / “測試代理”. It is now correctly consumed by Organization structured data, so it must be replaced before production.
- Editorial SEO overrides can still duplicate another page if an editor deliberately enters identical values. Deterministic fallbacks are unique; cross-document editorial uniqueness remains a governance responsibility.
- No automated metadata regression suite exists yet. The audit used production builds and HTTP/HTML assertions; these checks should eventually be moved into CI if the route set grows.

## Verification commands

- `npm run typecheck`
- scoped ESLint over all changed SEO files
- `npm run build`
- production build with `VERCEL_ENV=production`
- HTTP/HTML assertions for metadata, canonical, hreflang, JSON-LD, robots headers, sitemap rows, 404/405 behavior, UTM normalization, and Active → Archived lifecycle
