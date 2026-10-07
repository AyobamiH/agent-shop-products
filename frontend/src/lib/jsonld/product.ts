import type { Product } from "@/domain/catalog/types";
import { categoryLabel } from "@/domain/catalog/facets";
import { absoluteUrl } from "@/lib/site";

export function buildProductJsonLd(product: Product): Record<string, unknown> {
  const url = absoluteUrl(`/products/${product.slug}`);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#capability`,
    url,
    mainEntityOfPage: url,
    name: product.name,
    description: product.summary,
    category: categoryLabel(product.category),
    keywords: product.tags.join(", "),
    additionalType: product.productType,
  };
}

export function buildItemListJsonLd(
  products: readonly Product[],
  name: string,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: products.length,
    itemListElement: products.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: product.name,
      url: absoluteUrl(`/products/${product.slug}`),
    })),
  };
}

export function buildProductBreadcrumbJsonLd(product: Product): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Agent discovery", item: absoluteUrl("/agents") },
      { "@type": "ListItem", position: 2, name: "Capability catalogue", item: absoluteUrl("/shop") },
      {
        "@type": "ListItem",
        position: 3,
        name: product.name,
        item: absoluteUrl(`/products/${product.slug}`),
      },
    ],
  };
}
