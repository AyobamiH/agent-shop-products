import { useCallback, useMemo, useState } from "react";
import type { CatalogQuery } from "@/domain/catalog/search";
import type { ProductType } from "@/domain/catalog/types";

export type CatalogFilters = {
  readonly text: string;
  readonly categories: readonly string[];
  readonly productTypes: readonly ProductType[];
  readonly tags: readonly string[];
};

const EMPTY: CatalogFilters = { text: "", categories: [], productTypes: [], tags: [] };

/**
 * Local browse state for the catalogue. Kept out of components so the filter
 * semantics can be tested and later moved to URL state without a UI rewrite.
 */
export function useCatalogFilters(initial?: Partial<CatalogFilters>) {
  const [filters, setFilters] = useState<CatalogFilters>({ ...EMPTY, ...initial });

  const setText = useCallback((text: string) => {
    setFilters((current) => ({ ...current, text }));
  }, []);

  const toggle = useCallback(<K extends "categories" | "productTypes" | "tags">(key: K) => {
    return (value: string) => {
      setFilters((current) => {
        const list = current[key] as readonly string[];
        const next = list.includes(value)
          ? list.filter((item) => item !== value)
          : [...list, value];
        return { ...current, [key]: next };
      });
    };
  }, []);

  const reset = useCallback(() => setFilters(EMPTY), []);

  const toggleCategory = useMemo(() => toggle("categories"), [toggle]);
  const toggleProductType = useMemo(() => toggle("productTypes"), [toggle]);
  const toggleTag = useMemo(() => toggle("tags"), [toggle]);

  const isActive =
    filters.text.trim().length > 0 ||
    filters.categories.length > 0 ||
    filters.productTypes.length > 0 ||
    filters.tags.length > 0;

  return { filters, setText, toggleCategory, toggleProductType, toggleTag, reset, isActive };
}

/** Filters are multi-select in the UI; the domain query matches any selected value. */
export function toQueries(filters: CatalogFilters): readonly CatalogQuery[] {
  const categories = filters.categories.length > 0 ? filters.categories : [undefined];
  const types = filters.productTypes.length > 0 ? filters.productTypes : [undefined];

  const queries: CatalogQuery[] = [];
  for (const category of categories) {
    for (const productType of types) {
      queries.push({
        text: filters.text,
        ...(category ? { category } : {}),
        ...(productType ? { productType } : {}),
        ...(filters.tags.length > 0 ? { tags: filters.tags } : {}),
      });
    }
  }
  return queries;
}