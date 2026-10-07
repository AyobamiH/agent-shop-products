/**
 * The single catalogue boundary. UI code never imports catalogue JSON directly.
 *
 * The catalogue is validated and indexed once at module load; lookups are O(1)
 * and no transform runs inside a render path (DEC-011).
 */

import publicCatalogJson from "@catalog/products.public.json";
import { parsePublicCatalog } from "./schema";
import { catalogSource } from "./source";
import type { Product, PublicCatalog } from "./types";

const catalog: PublicCatalog = parsePublicCatalog(publicCatalogJson);

const products: readonly Product[] = [...catalog.products].sort((a, b) =>
  a.name.localeCompare(b.name),
);

const bySlug = new Map(products.map((product) => [product.slug, product]));
const byId = new Map(products.map((product) => [product.id, product]));

const byCategory = groupBy(products, (product) => [product.category]);
const byTag = groupBy(products, (product) => product.tags);

export const catalogMeta = {
  schemaVersion: catalog.schemaVersion,
  catalogKind: catalog.catalogKind,
  syncedOn: catalogSource.syncedOn,
  upstreamRepository: catalogSource.upstream.repository,
  productCount: products.length,
} as const;

export function listProducts(): readonly Product[] {
  return products;
}

export function getProductBySlug(slug: string): Product | undefined {
  return bySlug.get(slug);
}

export function getProductById(id: string): Product | undefined {
  return byId.get(id);
}

export function listCategories(): readonly string[] {
  return [...byCategory.keys()].sort();
}

export function listTags(): readonly string[] {
  return [...byTag.keys()].sort();
}

export function listProductTypes(): readonly string[] {
  return [...new Set(products.map((product) => product.productType))].sort();
}

export function getProductsByCategory(category: string): readonly Product[] {
  return byCategory.get(category) ?? [];
}

export function getProductsByTag(tag: string): readonly Product[] {
  return byTag.get(tag) ?? [];
}

function groupBy(
  items: readonly Product[],
  keysOf: (product: Product) => readonly string[],
): Map<string, Product[]> {
  const map = new Map<string, Product[]>();

  for (const item of items) {
    for (const key of keysOf(item)) {
      const bucket = map.get(key);
      if (bucket) bucket.push(item);
      else map.set(key, [item]);
    }
  }

  return map;
}