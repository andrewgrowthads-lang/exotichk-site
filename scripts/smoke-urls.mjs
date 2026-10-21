/**
 * Local smoke check: fetches key public URLs from a running server and
 * prints status, canonical, robots, hreflang set, contact hosts, and
 * prices, one JSON line per URL, so two runs can be diffed.
 *
 * Usage: node scripts/smoke-urls.mjs [baseUrl] [extra paths...]
 */
const base = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");
const extra = process.argv.slice(3);

const paths = [
  "/",
  "/zh-hk/",
  "/hong-kong/",
  "/zh-hk/hong-kong/",
  "/hong-kong/tst/",
  "/hong-kong/wan-chai/",
  "/zh-hk/hong-kong/tst/",
  "/hong-kong/profiles/katy/",
  "/zh-hk/hong-kong/profiles/katy/",
  "/hong-kong/profiles/mia/",
  "/hong-kong/central/",
  "/zh-hk/hong-kong/central/",
  "/singapore/",
  "/zh-hk/singapore/",
  "/singapore/profiles/katy/",
  "/singapore/tst/",
  "/hong-kong/does-not-exist/",
  "/sitemap.xml",
  "/robots.txt",
  ...extra,
];

function all(html, regex) {
  return [...html.matchAll(regex)].map((match) => match[1]);
}

for (const path of paths) {
  const response = await fetch(base + path, { redirect: "manual" });
  const html = response.status === 200 ? await response.text() : "";
  const row = { path, status: response.status };
  if (response.status >= 300 && response.status < 400) row.location = response.headers.get("location");
  if (path === "/sitemap.xml") {
    row.urls = all(html, /<loc>([^<]+)<\/loc>/g);
  } else if (html) {
    row.canonical = all(html, /<link rel="canonical" href="([^"]+)"/g)[0];
    row.robots = all(html, /<meta name="robots" content="([^"]+)"/g)[0];
    row.hreflang = all(html, /<link rel="alternate" hrefLang="([^"]+)"/g);
    row.title = all(html, /<title>([^<]*)<\/title>/g)[0];
    row.contacts = [...new Set(all(html, /href="(https:\/\/(?:wa\.me|t\.me)\/[^"?]*)/g))];
    row.prices = [...new Set(all(html, /((?:HK|S)\$(?:&nbsp;|\s)\d+)/g))];
    row.profileLinks = [...new Set(all(html, /href="(\/(?:zh-hk\/)?[a-z-]+\/profiles\/[a-z0-9-]+\/)"/g))].length;
  }
  console.log(JSON.stringify(row));
}
