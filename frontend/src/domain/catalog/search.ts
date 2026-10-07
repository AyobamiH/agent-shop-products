/**
 * Deterministic lexical search and filtering over the catalogue.
 *
 * Pure functions only: no React, no I/O, no global state. The future CLI
 * `shop search` is expected to reuse this module unchanged.
 */

import { normalizeText, tokenize } from "@/lib/text/normalize";
import type { Product, ProductType } from "./types";

export type CatalogQuery = {
  readonly text?: string;
  readonly category?: string;
  readonly productType?: ProductType;
  readonly tags?: readonly string[];
};

type FieldWeight = { readonly weight: number; readonly read: (product: Product) => string };

/** Weighted lexical fields. Order is documented, deterministic and testable. */
const SEARCH_FIELDS: readonly FieldWeight[] = [
  { weight: 6, read: (product) => product.name },
  { weight: 4, read: (product) => product.problem },
  { weight: 3, read: (product) => product.summary },
  { weight: 2, read: (product) => product.tags.join(" ") },
  { weight: 2, read: (product) => product.category },
  { weight: 1, read: (product) => product.coreOutcomes.join(" ") },
];

export function matchesFilters(product: Product, query: CatalogQuery): boolean {
  if (query.category && product.category !== query.category) return false;
  if (query.productType && product.productType !== query.productType) return false;
  if (query.tags?.length && !query.tags.every((tag) => product.tags.includes(tag))) {
    return false;
  }
  return true;
}

/** Returns 0 when the product does not match every query token. */
export function scoreProduct(product: Product, text: string): number {
  const tokens = tokenize(text);
  if (tokens.length === 0) return 1;

  const haystacks = SEARCH_FIELDS.map((field) => ({
    weight: field.weight,
    value: normalizeText(field.read(product)),
  }));

  let score = 0;

  for (const token of tokens) {
    let tokenScore = 0;
    for (const haystack of haystacks) {
      if (haystack.value.includes(token)) tokenScore += haystack.weight;
    }
    if (tokenScore === 0) return 0;
    score += tokenScore;
  }

  return score;
}

export function searchProducts(
  products: readonly Product[],
  query: CatalogQuery,
): readonly Product[] {
  const text = query.text?.trim() ?? "";
  const filtered = products.filter((product) => matchesFilters(product, query));

  if (text.length === 0) return filtered;

  return filtered
    .map((product) => ({ product, score: scoreProduct(product, text) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.product.name.localeCompare(b.product.name))
    .map((entry) => entry.product);
}