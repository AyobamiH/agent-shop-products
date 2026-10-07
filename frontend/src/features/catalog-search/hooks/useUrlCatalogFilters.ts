import { useCallback, useMemo } from "react";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import type { ProductType } from "@/domain/catalog/types";
import { toFilters, toSearchParams } from "../lib/search-params";
import type { CatalogFilters } from "./useCatalogFilters";

const shopRoute = getRouteApi("/shop");

/**
 * Same contract as useCatalogFilters, but backed by the URL so browse state
 * survives refresh and can be shared. Typing replaces the current history
 * entry (replaceState) so the back button does not step through keystrokes;
 * discrete facet toggles and resets push a new entry (pushState) so back and
 * forward restore the previous filter set.
 */
export function useUrlCatalogFilters() {
  const search = shopRoute.useSearch();
  const navigate = useNavigate({ from: "/shop" });

  const filters = useMemo(() => toFilters(search), [search]);

  const apply = useCallback(
    (next: CatalogFilters, mode: "push" | "replace") => {
      void navigate({ search: toSearchParams(next), replace: mode === "replace" });
    },
    [navigate],
  );

  const setText = useCallback(
    (text: string) => apply({ ...filters, text }, "replace"),
    [apply, filters],
  );

  const toggleValue = useCallback(
    (key: "categories" | "productTypes" | "tags", value: string) => {
      const list = filters[key] as readonly string[];
      const next = list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
      apply({ ...filters, [key]: next }, "push");
    },
    [apply, filters],
  );

  const toggleCategory = useCallback(
    (value: string) => toggleValue("categories", value),
    [toggleValue],
  );
  const toggleProductType = useCallback(
    (value: string) => toggleValue("productTypes", value as ProductType),
    [toggleValue],
  );
  const toggleTag = useCallback((value: string) => toggleValue("tags", value), [toggleValue]);

  const reset = useCallback(() => {
    apply({ text: "", categories: [], productTypes: [], tags: [] }, "push");
  }, [apply]);

  const isActive =
    filters.text.trim().length > 0 ||
    filters.categories.length > 0 ||
    filters.productTypes.length > 0 ||
    filters.tags.length > 0;

  return { filters, setText, toggleCategory, toggleProductType, toggleTag, reset, isActive };
}