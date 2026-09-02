/**
 * Serializes structured data safely: `<` is escaped so CMS-sourced text
 * cannot break out of the `<script>` tag. Only `Organization`/`WebSite`
 * and `BreadcrumbList` are emitted anywhere on the site — no invented
 * `Review`/`AggregateRating`, and no `ProfilePage`/`CollectionPage`
 * (neither produces a rich result, both are extra surface to maintain).
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}

export function organizationJsonLd(params: { name: string; url: string; logoUrl?: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: params.name,
    url: params.url,
    ...(params.logoUrl ? { logo: params.logoUrl } : {}),
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
