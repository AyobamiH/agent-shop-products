import { absoluteUrl, PRODUCT_HEADLINE, SITE_DESCRIPTOR } from "@/lib/site";

export function buildWebSiteJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${absoluteUrl("/")}#website`,
    url: absoluteUrl("/"),
    name: SITE_DESCRIPTOR,
    description: PRODUCT_HEADLINE,
  };
}

export function buildCollectionPageJsonLd({
  path,
  name,
  description,
}: {
  path: string;
  name: string;
  description: string;
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${absoluteUrl(path)}#collection`,
    url: absoluteUrl(path),
    name,
    description,
    isPartOf: { "@id": `${absoluteUrl("/")}#website` },
  };
}
