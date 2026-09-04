/**
 * Serializes structured data safely: `<` is escaped so CMS-sourced text
 * cannot break out of the `<script>` tag. Only factual
 * `Organization`, `WebSite`, and `BreadcrumbList` nodes are emitted —
 * no invented `Review`/`AggregateRating` and no unsupported claims.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}

export function organizationJsonLd(params: { name: string; url: string; logoUrl?: string; description?: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${params.url}#organization`,
    name: params.name,
    url: params.url,
    ...(params.description ? { description: params.description } : {}),
    ...(params.logoUrl ? { logo: { "@type": "ImageObject", url: params.logoUrl } } : {}),
  };
}

export function websiteJsonLd(params: { name: string; url: string; language: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: params.name,
    url: params.url,
    inLanguage: params.language,
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
