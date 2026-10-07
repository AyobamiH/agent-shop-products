/**
 * Facet values derived once from the catalogue, with counts computed against
 * the currently visible result set so filter chips never lie.
 */

import { humanizeSlug } from "@/lib/text/normalize";
import { listCategories, listTags } from "./repository";
import type { Product } from "./types";

export type Facet = {
  readonly value: string;
  readonly label: string;
  readonly count: number;
};

export function categoryLabel(category: string): string {
  return humanizeSlug(category);
}

export function tagLabel(tag: string): string {
  return humanizeSlug(tag);
}

export function buildCategoryFacets(products: readonly Product[]): readonly Facet[] {
  const counts = countBy(products, (product) => [product.category]);
  return listCategories()
    .map((value) => ({ value, label: categoryLabel(value), count: counts.get(value) ?? 0 }))
    .filter((facet) => facet.count > 0);
}

export function buildTagFacets(products: readonly Product[], limit?: number): readonly Facet[] {
  const counts = countBy(products, (product) => product.tags);
  const facets = listTags()
    .map((value) => ({ value, label: tagLabel(value), count: counts.get(value) ?? 0 }))
    .filter((facet) => facet.count > 0)
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));

  return typeof limit === "number" ? facets.slice(0, limit) : facets;
}

function countBy(
  products: readonly Product[],
  keysOf: (product: Product) => readonly string[],
): Map<string, number> {
  const counts = new Map<string, number>();

  for (const product of products) {
    for (const key of keysOf(product)) {
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  return counts;
}

export function buildProductTypeFacets(products: readonly Product[]): readonly Facet[] {
  const counts = countBy(products, (product) => [product.productType]);
  return [...counts.keys()]
    .sort()
    .map((value) => ({ value, label: humanizeSlug(value), count: counts.get(value) ?? 0 }));
}