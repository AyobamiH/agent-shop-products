import type { CatalogFilters } from "../hooks/useCatalogFilters";

function join(values: readonly string[]): string {
  return values.join(", ");
}

/** Human sentence describing the active filters, for screen-reader announcements. */
export function describeFilters(filters: CatalogFilters, resultCount: number): string {
  const parts: string[] = [];
  if (filters.text.trim().length > 0) parts.push(`search "${filters.text.trim()}"`);
  if (filters.productTypes.length > 0) parts.push(`type ${join(filters.productTypes)}`);
  if (filters.categories.length > 0) parts.push(`category ${join(filters.categories)}`);
  if (filters.tags.length > 0) parts.push(`tags ${join(filters.tags)}`);

  const results = `${resultCount} ${resultCount === 1 ? "product" : "products"}`;
  if (parts.length === 0) return `Filters cleared. Showing all ${results}.`;
  return `Filtered by ${parts.join("; ")}. ${results} shown.`;
}