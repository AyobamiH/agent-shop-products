/**
 * JSON-LD generation.
 *
 * No `offers`, `aggregateRating` or `review` node is emitted: the catalogue
 * contains no price, rating or review data and none may be invented (DEC-005).
 */

import type { Product } from "@/domain/catalog/types";
import { categoryLabel } from "@/domain/catalog/facets";

export function buildProductJsonLd(product: Product): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
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
      url: `/products/${product.slug}`,
    })),
  };
}