/**
 * Source-backed knowledge topics (DEC-009).
 *
 * There are no authored articles in this phase. Each topic card is derived
 * directly from catalogue metadata for one category and cites the product ids
 * that back it. No filler content is generated.
 */

import { categoryLabel } from "@/domain/catalog/facets";
import { listCategories, getProductsByCategory } from "@/domain/catalog/repository";
import type { Product } from "@/domain/catalog/types";

export type KnowledgeTopic = {
  readonly id: string;
  readonly label: string;
  /** Verbatim catalogue problem statements addressed within this topic. */
  readonly problems: readonly string[];
  /** Verbatim catalogue boundaries: what these products explicitly do not do. */
  readonly boundaries: readonly string[];
  /** Internal citation — the catalogue records that back the topic. */
  readonly sourceProductIds: readonly string[];
  readonly products: readonly Product[];
};

const MAX_ITEMS_PER_TOPIC = 4;

export function buildKnowledgeTopics(): readonly KnowledgeTopic[] {
  return listCategories()
    .map((category) => toTopic(category, getProductsByCategory(category)))
    .filter((topic) => topic.problems.length > 0 && topic.boundaries.length > 0);
}

function toTopic(category: string, products: readonly Product[]): KnowledgeTopic {
  return {
    id: category,
    label: categoryLabel(category),
    problems: unique(products.map((product) => product.problem)).slice(0, MAX_ITEMS_PER_TOPIC),
    boundaries: unique(products.flatMap((product) => [...product.boundaries])).slice(
      0,
      MAX_ITEMS_PER_TOPIC,
    ),
    sourceProductIds: products.map((product) => product.id),
    products,
  };
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}