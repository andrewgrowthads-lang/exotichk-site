# Security baseline and deployment checklist

Last reviewed: 2026-09-03

This document separates controls enforced by source code from controls that must be configured in Sanity, Vercel/hosting, Cloudflare/DNS, and the identity provider. It does not assume that a source-level check can replace account security, token rotation, TLS configuration, or edge rate limiting.

## 1. Secrets and environment variables

### Source-enforced rules

- `src/lib/env.ts` imports `server-only`. Any future import of this module from a Client Component fails the build.
- `src/lib/publicEnv.ts` is the only browser-safe environment module. It contains only Sanity project ID and dataset name; these identify a Content Lake but do not authorize access.
- `SANITY_READ_TOKEN` and `SANITY_REVALIDATE_SECRET` never use the `NEXT_PUBLIC_` prefix.
- Production startup fails if `SANITY_READ_TOKEN` or `SANITY_REVALIDATE_SECRET` is absent.
- The webhook secret must contain at least 32 characters.
- Production `NEXT_PUBLIC_SITE_URL` must be an HTTPS origin without path, query, or fragment.
- `.env*` is ignored except `.env.example`. Generated `.next/`, `dist/`, and `.sanity/` output is ignored.
- Browser production source maps are explicitly disabled in `next.config.ts`.

### Required operational policy

- The web app receives exactly one Sanity robot token: `SANITY_READ_TOKEN`, with Viewer/read-only permissions and an expiration date.
- Never add `SANITY_AUTH_TOKEN`, an Editor token, an Administrator token, a personal CLI token, or a Sanity login token to Vercel.
- Use separate values for Production and Preview. Do not copy production secrets into Development unless required.
- Rotate the Sanity Viewer token and webhook secret at least every 90 days and immediately after suspected exposure or staff departure.
- Store secrets only in Vercel encrypted environment variables and the local ignored `.env.local`. Never paste them into tickets, chat, source code, build logs, analytics, or URLs.

### Current blocking finding

The locally configured `SANITY_READ_TOKEN` and `SANITY_AUTH_TOKEN` are the same credential, and a dry-run mutation confirmed that it is write-capable. No document was written during the check, but this token is not acceptable for the production frontend.

Before deployment:

1. Create a dedicated project robot token with the Sanity **Viewer** role and an expiration date.
2. Replace `SANITY_READ_TOKEN` in every hosting environment.
3. Delete/revoke the old shared write-capable token.
4. Remove `SANITY_AUTH_TOKEN` from the web-app environment; normal runtime and Studio login do not need it.
5. Re-run a dry-run mutation check and confirm HTTP 403/write denied.

## 2. Sanity CMS access

- Claim/attach the Sanity project to the intended organization before production.
- Human editors use named user accounts; credentials must never be shared.
- Editors receive Editor/Contributor access as needed. Only a minimal number of owners receive Administrator/Developer access.
- Review members, robot tokens, CORS origins, webhooks, and deployed Studios quarterly.
- Limit CORS origins to the exact deployed Studio origin and approved localhost development origins. Do not enable wildcard origins or credentials for arbitrary origins.
- The production dataset remains private. Public page reads happen server-side with the Viewer token.
- The revalidation webhook sends its secret in `x-sanity-webhook-secret`, never in the URL.

### 2FA requirement

Sanity supports centrally enforceable MFA through SAML SSO backed by an identity provider such as Okta, Google Workspace, or Microsoft Entra ID. Sanity documents this as an Enterprise feature or a Growth plan with the SAML SSO add-on.

For an enforceable organization-wide requirement:

1. Enable Sanity SAML SSO.
2. Require MFA in the identity provider.
3. Map IdP groups to least-privilege Sanity roles.
4. Disable or tightly restrict non-SSO access and retain tested break-glass administrator recovery.

Without SAML enforcement, team members can use Google/GitHub accounts protected by their provider's 2FA, but the project cannot prove or centrally enforce MFA for every Sanity login from source code. If mandatory 2FA is a launch requirement, the appropriate Sanity plan and IdP policy are therefore launch blockers, not optional code improvements.

## 3. Server/client trust boundary

- `src/sanity/client.ts` is server-only and is the only authenticated Sanity client.
- `src/sanity/image.ts` uses only browser-safe project/dataset identifiers; it does not import the authenticated client.
- Main content and metadata are Server Components. Client Components receive already-projected public data only.
- A production-bundle scan must find no literal values of `SANITY_READ_TOKEN`, `SANITY_REVALIDATE_SECRET`, or any write token.

## 4. XSS and content rendering

- React escapes CMS text by default. There is no raw CMS HTML renderer, `eval`, or `new Function`.
- The only `dangerouslySetInnerHTML` is JSON-LD serialization in `components/seo/JsonLd.tsx`; `<` is escaped to prevent `</script>` breakout.
- Current long-form fields are plain text, not arbitrary HTML.
- If Portable Text is introduced later, render it through an explicit component allowlist. Never add a generic raw-HTML block.
- Runtime contact URL sanitization allows only HTTPS `wa.me` and `t.me` URLs without credentials or custom ports. This protects against content written through the API, because Studio schema validation alone is not a runtime security boundary.

## 5. External links

- WhatsApp and Telegram hosts are validated in Studio and validated again at runtime.
- Contact links use `rel="noopener noreferrer external"`.
- No redirect endpoint accepts an arbitrary destination.
- Permanent slug redirects are a code-reviewed static ledger; destinations cannot be supplied by visitors or CMS content.

## 6. Images

- Public catalogue images are limited to `https://cdn.sanity.io/images/...`.
- The custom Next image loader rejects non-HTTPS, non-Sanity, and non-image Sanity origins.
- The previous local Sharp image proxy and the app's direct Sharp dependency were removed: there are no local images, and retaining a public transformation endpoint created unnecessary file-reading and CPU/DoS surface. Next.js may still carry Sharp as its own optional/transitive package.
- Sanity image references are converted to CDN URLs by the official image URL builder.
- Upload type/size moderation and asset deletion permissions are controlled in Sanity roles and editorial policy, not by the public frontend.

## 7. API and preview surface

- `/api/revalidate` accepts POST only, compares the webhook secret with Node's constant-time primitive, accepts no caller-controlled path/tag, and returns `Cache-Control: no-store`.
- GET and unsupported methods return 405.
- `/api/*` receives `X-Robots-Tag: noindex, nofollow, noarchive`.
- There is no Draft Mode, preview-content route, debug route, health route, admin panel, or embedded Studio in the public Next.js app.
- Sanity Studio is deployed separately and must be access-controlled by Sanity/SSO.
- Non-production Vercel deployments return global `X-Robots-Tag: noindex, nofollow`; their robots.txt disallows crawling. This is indexing protection, not access control.
- Catalogue routes deliberately keep dynamic parameters enabled so newly published CMS entries can become available without a full deployment. Unknown slugs are syntax-checked, queried only against published content, and return 404. Edge rate limiting remains the appropriate control for high-volume enumeration.

The internal profile ID included in the pre-filled WhatsApp message is visible in the rendered `wa.me` URL. This is intentional operational data, but it must not contain secrets or sensitive personal information.

## 8. Security headers and CSP

`next.config.ts` applies:

- `Content-Security-Policy`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- restrictive `Permissions-Policy`
- `X-DNS-Prefetch-Control: off`
- `Origin-Agent-Cluster: ?1`
- `X-Powered-By` disabled

CSP currently restricts all resources to self by default, allows images from self/Sanity/data, blocks objects, frames, inline script attributes, foreign framing, and foreign form targets, and upgrades insecure requests in production.

`'unsafe-inline'` remains for script/style elements because the statically generated Next.js App Router output contains framework inline bootstrap/style content. A nonce requires per-request middleware and would convert the catalogue from static ISR to dynamic rendering. Hashes are build-specific and operationally brittle. Therefore:

- Do not add `'unsafe-eval'`.
- Do not add wildcard script/connect origins.
- Test every CSP change on Preview.
- If Vercel/Next later supports stable hashes/nonces without sacrificing static rendering, remove `'unsafe-inline'`.

HSTS preload is only safe when every current and future subdomain is HTTPS. Do not submit the domain to the browser preload list until the DNS/subdomain inventory has been checked.

## 9. Dependencies

- Lockfile is committed.
- `npm audit --omit=dev` currently reports zero production vulnerabilities.
- Full `npm audit` reports seven moderate and one high advisory in the Sanity CLI/build dependency tree (`js-yaml`, `smol-toml`, `uuid`, and related packages). The offered automated fix downgrades Sanity across a major version and is not safe to apply blindly.
- These findings are build/Studio tooling, not dependencies shipped in the Next.js production runtime. Track Sanity releases and update when an upstream compatible fix exists.
- Compatible updates for `@sanity/client` and React DOM types were applied.
- Do not run `npm audit fix --force` without a reviewed migration and full Studio/schema regression test.

## 10. Source maps and build artifacts

- `productionBrowserSourceMaps: false` prevents public Next.js browser source maps.
- `.next/`, Sanity `dist/`, and `.sanity/` are generated and ignored.
- A local Turbopack `.next/cache` entry may contain build-time server configuration because SSG reads Sanity during the build. It is not part of `.next/static` or the public response, but the entire `.next/` directory must be treated as internal build output and never committed or manually published.
- Do not upload local build directories as static public assets.
- Enable Vercel Protected Source Maps as defense in depth, especially if an error-monitoring integration later enables source-map generation.
- Server logs and platform traces may still contain stack traces. Restrict hosting/log access and configure retention externally.

## 11. Controls that cannot be completed in source code

The following must be configured and verified outside this repository.

### Sanity / identity provider

- Claim the project and place it in the correct organization.
- Enforce SAML SSO plus IdP MFA/2FA.
- Assign least-privilege human roles.
- Replace the current write-capable frontend token with an expiring Viewer robot token.
- Revoke unused/personal/anonymous robot tokens.
- Restrict CORS origins.
- Configure and rotate the signed revalidation webhook.
- Review audit/activity logs according to the selected Sanity plan.

### Vercel / hosting

- Set production-only secrets and the final HTTPS `NEXT_PUBLIC_SITE_URL`.
- Enable Deployment Protection for Preview deployments; robots/noindex does not prevent unauthorized reading.
- Enable Protected Source Maps.
- Confirm production branch controls and require reviewed CI before deployment.
- Add edge rate limiting/WAF rules for `/api/revalidate` and abusive traffic. Keep the webhook path reachable from Sanity.
- Restrict team access, require hosting-account MFA/SSO, and review integration permissions.
- Configure log retention and alerts without recording secret headers.
- Verify HTTP to HTTPS and `www` to canonical-host redirects at the platform level.

### Cloudflare / DNS / registrar

- Enable registrar lock, account MFA, least-privilege DNS access, and DNSSEC.
- Restrict CAA records to the intended certificate authorities.
- Inventory all subdomains before HSTS preload; every included subdomain must support HTTPS permanently.
- If Cloudflare remains DNS-only, rate limiting/WAF must be done at Vercel. If proxying is enabled later, retest ISR, webhook delivery, cache behavior, client IP handling, and Sanity image traffic before production.
- Configure a single canonical apex/`www` strategy and prevent dangling DNS records/subdomain takeover.
- Monitor certificate issuance/expiry and DNS changes.

## 12. Verification checklist

- `npm run typecheck`
- scoped ESLint and production `npm run build`
- `npm audit --omit=dev`
- search `.next/static` for secret literals after a production build
- verify CSP/HSTS/nosniff/referrer/permissions headers with `curl -I`
- verify `/api/revalidate` returns 401 without the secret, 405 for GET, and never caches responses
- verify non-production deployments are protected by Vercel Authentication, not only noindex
- verify Sanity Viewer token can read but receives 403 on a dry-run mutation
- review Sanity members/tokens/CORS/webhooks and IdP MFA policy

## References

- [Sanity SAML SSO](https://www.sanity.io/docs/developer-guides/sso-saml)
- [Sanity authentication and robot tokens](https://www.sanity.io/docs/content-lake/http-auth)
- [Sanity roles and permissions](https://www.sanity.io/docs/content-lake/roles-concepts)
- [Vercel Protected Source Maps](https://vercel.com/docs/deployment-protection/protected-source-maps)
- [Vercel production security checklist](https://vercel.com/docs/production-checklist)
