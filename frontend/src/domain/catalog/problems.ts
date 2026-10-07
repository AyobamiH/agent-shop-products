/**
 * Problem-first discovery index (DEC-008).
 *
 * Problem statements are rendered verbatim from the catalogue `problem` field.
 * Grouping uses the catalogue `category` field. Nothing here is authored copy.
 */

import { categoryLabel } from "./facets";
import { listCategories, getProductsByCategory } from "./repository";
import type { Product } from "./types";

export type ProblemEntry = {
  readonly product: Product;
  readonly problem: string;
};

export type ProblemGroup = {
  readonly category: string;
  readonly label: string;
  readonly entries: readonly ProblemEntry[];
};

export function buildProblemIndex(): readonly ProblemGroup[] {
  return listCategories().map((category) => ({
    category,
    label: categoryLabel(category),
    entries: getProductsByCategory(category).map((product) => ({
      product,
      problem: product.problem,
    })),
  }));
}