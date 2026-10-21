# Multi-country expansion (Hong Kong + Singapore)

One website, one codebase, one Vercel project, one Sanity project/dataset/Studio.

## 1. Baseline audit (before any change, 2026-10-21)

Captured from the `main` working tree (clean, commit `bec8a9c`) and a
read-only query of the production dataset.

### Routing (App Router)

- Two root layouts (route groups): `app/(en)/` (no prefix) and `app/zh-hk/`.
- Every locale has the same four page types: `/`, `/[country]/`,
  `/[country]/[district]/`, `/[country]/profiles/[profile]/`.
- `/` rendered the catalogue of the *first* country by `sortOrder`
  (Hong Kong) — the same content as `/hong-kong/`, with its own canonical.
- `dynamicParams = true` everywhere; `generateStaticParams` shared via
  `sanity/queries.ts`.

### Already multi-country

- Every catalogue query is scoped by `country->slug.current == $countrySlug`
  plus `district->country._ref == country._ref` (a profile is listed only
  when its district belongs to its own country).
- Profile, district and country URLs all carry the country slug; profile
  slugs are unique per country (`uniqueSlugWithinCountry`).
- District picker in Studio already filters by the profile's country;
  `districtBelongsToCountry` and `districtCountryHasNoProfileConflicts`
  validators exist.
- Visibility (`lib/visibility.ts`), listing indexability, sitemap, hreflang
  and static params all go through one predicate and are country-agnostic.
- Revalidation: one shared `catalog` tag, expired by `POST /api/revalidate`
  (webhook secret header or verified Studio editor session). Callers cannot
  choose paths or tags.
- Analytics events (`profile_view`, `contact_click`, `channel_click`) carry
  `country` already.

### Hong-Kong-only assumptions found

| Area | Assumption |
| --- | --- |
| Contacts | Only in the `siteSettings` singleton — one set for the whole site. |
| Price | `formatHkd()` hardcodes `HK$`; Studio field titled "Price (HKD)". |
| Profile.country | Hidden field, initial value hardcoded to `hong-kong`. |
| Background | `SiteAtmosphere` falls back to the local Hong Kong photo for every country. |
| Flag | `showFlag={country.slug === "hong-kong"}`; only a Hong Kong SVG flag exists. |
| Header | Inline country chips; the first country links to `/`. |
| District labels | `districtLabels.ts` keyed by bare slug (`tst`, `wan-chai`). |
| Studio validation | "Needs a contact" checks profile overrides or `siteSettings` only. |

### Production data (read-only snapshot)

- Countries: `country-hong-kong` (slug `hong-kong`, active, no image). No Singapore document.
- Districts: `district-tst` (active), `district-wan-chai` (active, currently no visible profiles), `district-central` (archived, 301 → TST).
- Profiles: 21 Hong Kong documents, 8 publicly visible, all with Chinese summaries. Profile-level contact overrides exist only on 3 archived profiles.
- `siteSettings` contacts: WhatsApp `https://wa.me/66955233905`, Telegram `https://t.me/missmiraevilgirl`, channel `https://t.me/exotichk`.

### HTTP baseline (production build, local)

- `/`, `/zh-hk/`, `/hong-kong/`, `/zh-hk/hong-kong/`, `/hong-kong/tst/`: 200, self-canonical, `index, follow`, hreflang `en`, `zh-Hant`, `x-default`.
- `/hong-kong/wan-chai/`: 200, `noindex, follow` (empty listing).
- `/hong-kong/profiles/katy/` (+ zh): 200, contacts = HK WhatsApp/Telegram/channel, `HK$` prices.
- `/hong-kong/central/` → 301 `/hong-kong/tst/` (and zh).
- Archived profile (`/hong-kong/profiles/mia/`): 404. Any `/singapore/...`: 404.
- Sitemap: home (2), Hong Kong (2), TST (2), 8 profiles × 2 locales.
- Mobile: no horizontal overflow at 390/430; fixed atmosphere layer stays at
  `top: 0` with constant height while scrolling (`100lvh`, no
  `background-attachment: fixed`, no scroll listeners).

## 2. What changed

| Area | Now |
| --- | --- |
| `/`, `/zh-hk/` | Server-rendered "Choose your location" page: one card per visible country (CMS background image, else the bundled photo), `Organization` + `WebSite` JSON-LD, self-canonical, indexable. No geolocation, cookies or redirects. On `/zh-hk/`, a country without Chinese content links to its English page (`hrefLang="en"`, "英文版" badge) and is left out of the title/description. |
| Header | `CountrySwitcher`: `<details>` menu with flag + name, real links in server HTML, works before hydration; Escape, outside tap, arrow keys, closes on navigation; 44 px targets. Always goes to the other country's main catalogue. |
| Contacts | Per country on the `country` document (Studio → Country settings → Contacts). Profile overrides still win field by field. `siteSettings` contacts are legacy, read-only, and apply **only** to `hong-kong` and only while it has none of its own. No other country can ever reach them (`lib/contact.ts`, unit-tested). |
| Price | `country.currency` (`HKD`/`SGD`) → `HK$ 1500` / `S$ 1500`. Unknown currency → price hidden, never guessed. |
| Background / flag | `lib/countryPresets.ts`: bundled flag + licensed night photo per slug (`public/atmosphere/singapore-marina-bay-night*`, CC BY-SA 4.0, Dietmar Rabich). CMS `country.image` overrides. Same fixed `100lvh` layer, no scroll listeners. |
| District labels | Curated short labels keyed by `country/district`, so a same-slug district elsewhere never inherits them. |
| Studio | Menu: Profiles → country, Districts → country (new documents get the country pre-filled), Country settings, Site settings, All profiles, All districts. Profile form order: Country, Name, District, Age, Height, Nationality, Languages, Price (with currency badge), Description, Photos. Country locked after publish; district cleared when country changes; "no contact" is a warning. New Singapore profiles get `SG…` internal IDs; existing IDs unchanged. Publish on country/district/site settings also refreshes the site. |
| Sitemap | Location page listed in every locale; empty listings and untranslated locales still excluded. |

Unchanged: all Hong Kong URLs, redirects, robots, headers, translation flow
(`/api/translate`), webhook secret handling, analytics events.

## 3. Data migration (needs approval — not yet run)

Why: the Hong Kong country document has no `currency` and no contacts of its
own (they live in `siteSettings`), and there is no Singapore document.
The site already works without the migration (legacy fallback + currency
preset), so it can be deployed first and migrated after.

`scripts/migrate-multi-country.ts` — idempotent, dry-run by default, only
`setIfMissing` / `createIfNotExists`, Hong Kong patch guarded by revision:

```bash
npx sanity exec scripts/migrate-multi-country.ts --with-user-token            # dry run
npx sanity exec scripts/migrate-multi-country.ts --with-user-token -- --apply # write
```

Dry run against production (2026-10-21) plans exactly:

- `country-hong-kong`: set `currency=HKD`, `whatsappUrl=https://wa.me/66955233905`, `telegramUrl=https://t.me/missmiraevilgirl`, `telegramChannelUrl=https://t.me/exotichk`.
- create `country-singapore`: slug `singapore`, English title/intro, `SGD`, active, `sortOrder` 1, **no contacts**, no districts.

No profile, district, slug, internal ID or image is touched.

### Backup (before applying)

```bash
npx sanity dataset export production backups/production-$(date +%Y%m%d-%H%M).tar.gz
```

Read-only; includes drafts and image assets. Keep the file outside the repo
(it contains contact data).

### Rollback

- **Data:** the migration only adds. To undo it, delete the Singapore
  country while nothing references it:
  `npx sanity documents delete country-singapore`. If Singapore districts or
  profiles already exist, archive them in Studio instead (profiles first,
  then districts, then the country). The fields added to Hong Kong
  (`currency`, contacts) are harmless to old code and can stay.
- **Code:** Vercel → project `exotichk-site-1lrs` → Deployments → previous
  production deployment → Instant Rollback (or `npx vercel rollback <url>`).
  The previous code does not know about Singapore: if Singapore content is
  live it would show Singapore in the country chips with `HK$` prices and
  the Hong Kong contacts on Singapore profiles. So after a code rollback,
  immediately archive Singapore profiles and the Singapore country (or
  delete the country if it has no children).
- **Full restore (last resort):**
  `npx sanity dataset import backups/<file>.tar.gz production --replace` —
  overwrites documents with the backed-up versions; only with explicit
  approval.

## 4. How to

- **Publish a Singapore profile:** Studio → Profiles → Singapore → + → fill Name, District, … Price, Description, Photos → Publish Profile (or Publish English only).
- **Change Singapore contacts:** Studio → Country settings → Singapore → Contacts → edit → Publish. Live within seconds (Studio refresh + webhook). Empty field = button hidden.
- **Add a Singapore district:** Studio → Districts → Singapore → + → Title, Internal name, Slug (Generate), Intro → Publish. Its tab appears once it has a visible profile.

## 5. Verification (local, 2026-10-21)

- `npm run typecheck`, CI lint command (+ `scripts/`), `npm run build`, `sanity build`, `sanity schema validate`: pass.
- Unit tests (`npx --no-install tsx --test src/lib/multiCountry.test.ts src/sanity/lib/studioSiteUrl.test.ts scripts/profiles-import/csv.test.ts`): 19/19.
- Real production data, before migration: every Hong Kong URL identical to the baseline (status, canonical, robots, hreflang, title, contacts, prices, redirects, 404s, sitemap). Only `/` and `/zh-hk/` changed (chooser instead of catalogue).
- Mock dataset (production export + migration + synthetic Singapore content, served by a local GROQ server; nothing written to Sanity): Singapore pages `S$`, en + x-default hreflang only, no contact buttons when empty, Singapore-only contacts after a change + webhook revalidation, Hong Kong contacts unchanged; cross-country URLs 404; `/zh-hk/singapore/...` 404; empty district noindex and not in sitemap; 390/430/1440 px: no overflow, background layer stable, no console/hydration errors; switcher keyboard/touch flows.
- Not exercised: the Studio UI itself in a browser (needs an editor login), the real Sanity webhook, Vercel deployment.

## 6. Before launch (manual)

1. Review and approve, then commit/deploy the code (safe before migration).
2. Run the migration dry run, then `--apply`.
3. Studio → Country settings → Singapore: add contacts when ready; optionally a background image.
4. Studio → Districts → Singapore: add districts; then profiles.
5. Sanity → API → Webhooks: confirm the filter includes `country`, `district`, `siteSettings` (not only `profile`).
6. Site settings → Brand → Agency description: currently says "a Hong Kong profile catalogue" and is shown on the location page and in `Organization` JSON-LD — reword for both countries.
7. `npm run sanity:deploy` so editors get the new Studio.
8. After deploy: check `/`, `/singapore/`, a Singapore profile, Search Console URL inspection for `/` and `/singapore/`.
