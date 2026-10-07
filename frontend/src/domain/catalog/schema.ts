/**
 * Structural contract for the public catalogue projection.
 * Mirrors catalog/product-catalog.schema.json and the upstream contract in
 * AyobamiH/agent-shop-products.
 *
 * A malformed catalogue must fail loudly rather than produce partially
 * invented UI (docs/ARCHITECTURE.md — Data validation).
 */

import { z } from "zod";
import { PRODUCT_TYPES, type PublicCatalog } from "./types";

const slugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug must be lowercase kebab-case");

const nonEmptyString = z.string().min(1);

export const productSchema = z.object({
  id: nonEmptyString,
  slug: slugSchema,
  name: nonEmptyString,
  productType: z.enum(PRODUCT_TYPES),
  category: nonEmptyString,
  summary: nonEmptyString,
  problem: nonEmptyString,
  coreOutcomes: z.array(nonEmptyString),
  requirements: z.array(nonEmptyString),
  boundaries: z.array(nonEmptyString),
  tags: z.array(nonEmptyString),
  sourcePath: nonEmptyString.optional(),
});

export const publicCatalogSchema = z.object({
  schemaVersion: z.literal("1.0.0"),
  catalogKind: nonEmptyString,
  policy: z
    .object({
      noMockProducts: z.boolean().optional(),
      omitUnknownFieldsRatherThanInvent: z.boolean().optional(),
      commercialFieldsRequireAuthoritativeSource: z.boolean().optional(),
    })
    .optional(),
  products: z.array(productSchema).min(1),
});

export function parsePublicCatalog(input: unknown): PublicCatalog {
  const catalog = publicCatalogSchema.parse(input) as PublicCatalog;
  assertUniqueIdentity(catalog);
  return catalog;
}

function assertUniqueIdentity(catalog: PublicCatalog): void {
  const ids = new Set<string>();
  const slugs = new Set<string>();

  for (const product of catalog.products) {
    if (ids.has(product.id)) throw new Error(`Duplicate product id: ${product.id}`);
    if (slugs.has(product.slug)) throw new Error(`Duplicate product slug: ${product.slug}`);
    ids.add(product.id);
    slugs.add(product.slug);
  }
}