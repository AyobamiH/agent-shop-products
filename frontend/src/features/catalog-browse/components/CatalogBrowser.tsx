import { useMemo } from "react";
import {
  buildCategoryFacets,
  buildProductTypeFacets,
  buildTagFacets,
} from "@/domain/catalog/facets";
import { searchProducts } from "@/domain/catalog/search";
import type { Product } from "@/domain/catalog/types";
import { CopyLinkButton } from "@/features/catalog-search/components/CopyLinkButton";
import { FacetFilter } from "@/features/catalog-search/components/FacetFilter";
import { ProductSearch } from "@/features/catalog-search/components/ProductSearch";
import { toQueries } from "@/features/catalog-search/hooks/useCatalogFilters";
import { useUrlCatalogFilters } from "@/features/catalog-search/hooks/useUrlCatalogFilters";
import { describeFilters } from "@/features/catalog-search/lib/announce";
import { ProductList } from "./ProductList";

const MAX_TAG_FACETS = 12;
const RESULT_COUNT_ID = "catalog-result-count";
const CLEAR_BUTTON_CLASS =
  "inline-flex min-h-11 items-center rounded border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export function CatalogBrowser({ products }: { products: readonly Product[] }) {
  const { filters, setText, toggleCategory, toggleProductType, toggleTag, reset, isActive } =
    useUrlCatalogFilters();

  const results = useMemo(() => {
    const seen = new Set<string>();
    const merged: Product[] = [];
    for (const query of toQueries(filters)) {
      for (const product of searchProducts(products, query)) {
        if (seen.has(product.id)) continue;
        seen.add(product.id);
        merged.push(product);
      }
    }
    return merged;
  }, [products, filters]);

  const categoryFacets = useMemo(() => buildCategoryFacets(products), [products]);
  const typeFacets = useMemo(() => buildProductTypeFacets(products), [products]);
  const tagFacets = useMemo(() => buildTagFacets(products, MAX_TAG_FACETS), [products]);

  const announcement = useMemo(
    () => describeFilters(filters, results.length),
    [filters, results.length],
  );

  return (
    <div className="grid min-w-0 grid-cols-1 gap-8 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-10">
      <aside aria-label="Catalogue filters" className="space-y-6 lg:sticky lg:top-20 lg:self-start">
        <FacetFilter
          legend="Product type"
          facets={typeFacets}
          selected={filters.productTypes}
          onToggle={toggleProductType}
        />
        <FacetFilter
          legend="Category"
          facets={categoryFacets}
          selected={filters.categories}
          onToggle={toggleCategory}
        />
        <FacetFilter
          legend="Tags"
          facets={tagFacets}
          selected={filters.tags}
          onToggle={toggleTag}
        />
        {isActive ? (
          <button type="button" onClick={reset} className={CLEAR_BUTTON_CLASS}>
            Clear all filters
          </button>
        ) : null}
      </aside>

      <div className="min-w-0">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex-1">
            <ProductSearch
              value={filters.text}
              onChange={setText}
              describedById={RESULT_COUNT_ID}
            />
          </div>
          <CopyLinkButton />
        </div>

        <p
          id={RESULT_COUNT_ID}
          data-testid="result-count"
          className="mt-3 font-mono text-xs text-muted-foreground"
        >
          {results.length} of {products.length} products shown
        </p>

        <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">
          {announcement}
        </p>

        {results.length === 0 ? (
          <div className="mt-6 rounded-lg border border-dashed border-border p-8 text-center">
            <p className="text-sm font-medium">No products match these filters</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
              Nothing in the catalogue matches. Remove a filter or describe the problem in different
              words.
            </p>
            <button type="button" onClick={reset} className={`mt-4 ${CLEAR_BUTTON_CLASS}`}>
              Clear all filters
            </button>
          </div>
        ) : (
          <ProductList className="mt-6" products={results} columns={2} />
        )}
      </div>
    </div>
  );
}
