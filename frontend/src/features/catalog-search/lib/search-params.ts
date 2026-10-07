/**
 * URL projection for catalogue browse state.
 *
 * Multi-select facets serialize as comma-separated slugs so links stay short
 * and readable. Unknown or empty values are dropped rather than rejected: a
 * shared link should degrade to a wider result set, never to an error page.
 */

import { PRODUCT_TYPES, type ProductType } from "@/domain/catalog/types";
import type { CatalogFilters } from "../hooks/useCatalogFilters";

export type CatalogSearchParams = {
  readonly q?: string | undefined;
  readonly type?: string | undefined;
  readonly category?: string | undefined;
  readonly tag?: string | undefined;
};

const SEPARATOR = ",";

function parseList(value: unknown): readonly string[] {
  if (typeof value !== "string") return [];
  return [
    ...new Set(
      value
        .split(SEPARATOR)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
}

function serializeList(values: readonly string[]): string | undefined {
  return values.length > 0 ? values.join(SEPARATOR) : undefined;
}

export function validateCatalogSearch(raw: Record<string, unknown>): CatalogSearchParams {
  const params: CatalogSearchParams = {
    q: typeof raw["q"] === "string" && raw["q"].trim().length > 0 ? raw["q"] : undefined,
    type: serializeList(parseList(raw["type"])),
    category: serializeList(parseList(raw["category"])),
    tag: serializeList(parseList(raw["tag"])),
  };
  return params;
}

export function toFilters(params: CatalogSearchParams): CatalogFilters {
  const allowedTypes = new Set<string>(PRODUCT_TYPES);
  return {
    text: params.q ?? "",
    categories: parseList(params.category),
    productTypes: parseList(params.type).filter((value): value is ProductType =>
      allowedTypes.has(value),
    ),
    tags: parseList(params.tag),
  };
}

export function toSearchParams(filters: CatalogFilters): CatalogSearchParams {
  const text = filters.text.trim();
  return {
    q: text.length > 0 ? filters.text : undefined,
    type: serializeList(filters.productTypes),
    category: serializeList(filters.categories),
    tag: serializeList(filters.tags),
  };
}