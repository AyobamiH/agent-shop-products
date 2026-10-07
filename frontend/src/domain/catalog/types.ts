/**
 * Canonical product types for the public catalogue projection.
 *
 * Authoring authority: AyobamiH/agent-shop-products (products/<id>/product.json).
 * Local source of truth for the frontend: catalog/products.public.json, a
 * synced projection of that repository (DEC-001, DEC-002).
 *
 * Commercial fields (price, availability, checkout, ratings, reviews) and
 * evidence levels are deliberately absent. They are added only when an
 * authoritative record exists (DEC-005).
 */

export const PRODUCT_TYPES = ["prompt", "skill", "production-pack"] as const;

export type ProductType = (typeof PRODUCT_TYPES)[number];

export type Product = {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly productType: ProductType;
  readonly category: string;
  readonly summary: string;
  readonly problem: string;
  readonly coreOutcomes: readonly string[];
  readonly requirements: readonly string[];
  readonly boundaries: readonly string[];
  readonly tags: readonly string[];
  /** Path to the canonical payload inside the upstream repository. */
  readonly sourcePath?: string;
};

export type CatalogPolicy = {
  readonly noMockProducts?: boolean;
  readonly omitUnknownFieldsRatherThanInvent?: boolean;
  readonly commercialFieldsRequireAuthoritativeSource?: boolean;
};

export type PublicCatalog = {
  readonly schemaVersion: string;
  readonly catalogKind: string;
  readonly policy?: CatalogPolicy;
  readonly products: readonly Product[];
};