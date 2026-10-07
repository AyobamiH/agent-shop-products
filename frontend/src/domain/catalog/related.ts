/**
 * Deterministic related-product selection: shared category first, then shared
 * catalogue tags. No behavioural, popularity or purchase signal exists, so none
 * is implied.
 */

import { listProducts } from "./repository";
import type { Product } from "./types";

const SAME_CATEGORY_WEIGHT = 3;

export function getRelatedProducts(product: Product, limit = 3): readonly Product[] {
  const tags = new Set(product.tags);

  return listProducts()
    .filter((candidate) => candidate.id !== product.id)
    .map((candidate) => ({ candidate, score: relatednessScore(candidate, product.category, tags) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.candidate.name.localeCompare(b.candidate.name))
    .slice(0, limit)
    .map((entry) => entry.candidate);
}

function relatednessScore(candidate: Product, category: string, tags: ReadonlySet<string>): number {
  const sharedTags = candidate.tags.filter((tag) => tags.has(tag)).length;
  const categoryScore = candidate.category === category ? SAME_CATEGORY_WEIGHT : 0;
  return categoryScore + sharedTags;
}