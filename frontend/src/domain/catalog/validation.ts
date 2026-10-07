/**
 * Canonical catalogue guarantees shared by the build-time validator and the
 * test suite, so both enforce exactly the same contract.
 *
 * The catalogue is a synced projection of AyobamiH/agent-shop-products. These
 * checks fail loudly when the projection drifts from the explicit sync record
 * (catalog/source.json), gains fabricated commercial fields, or starts carrying
 * raw PROMPT.md / SKILL.md payload.
 */

import { publicCatalogSchema } from "./schema";
import type { Product, PublicCatalog } from "./types";

/** Expected inventory, taken from the sync record — never a magic number. */
export type ExpectedInventory = {
  readonly productCount: number;
  readonly productCountsByType: Readonly<Record<string, number>>;
  readonly productIds: readonly string[];
};

export const RETIRED_PRODUCT_SLUGS = ["audiogram", "audiogram-generator"] as const;

export const CANONICAL_PRODUCT_FIELDS = [
  "id",
  "slug",
  "name",
  "productType",
  "category",
  "summary",
  "problem",
  "coreOutcomes",
  "requirements",
  "boundaries",
  "tags",
  "sourcePath",
] as const;

/** Fields that must never appear because no authoritative source supplies them. */
export const FORBIDDEN_PRODUCT_FIELDS = [
  "price",
  "priceMinor",
  "currency",
  "checkoutUrl",
  "availability",
  "rating",
  "aggregateRating",
  "reviews",
  "sales",
  "customers",
  "downloads",
  "compatibility",
  "evidenceLevel",
  "evidenceBasis",
  "provenance",
  "version",
  "hasSample",
  "catalogTags",
  "body",
  "prompt",
  "promptBody",
  "content",
  "markdown",
] as const;

/** Longest a single projected record may be before it looks like payload, not metadata. */
const MAX_RECORD_JSON_CHARS = 8_000;

/** Longest a single projected string field may be before it looks like payload. */
const MAX_FIELD_CHARS = 1_200;

/**
 * Markers that indicate raw PROMPT.md or SKILL.md payload leaked into the
 * projection: code fences, Markdown headings, horizontal rules, and SKILL.md
 * YAML front matter (`---` followed by `name:` / `description:`).
 */
export const PAYLOAD_MARKERS: readonly RegExp[] = [
  /```/,
  /^\s{0,3}#{1,6}\s/m,
  /\n\s*---\s*\n/,
  /(^|\n)---\s*\n\s*(name|description|allowed-tools):/,
];

/**
 * Parses and fully validates a raw catalogue document against the expected
 * inventory from the sync record. Throws with an aggregated message.
 */
export function validateCanonicalCatalog(
  input: unknown,
  expected: ExpectedInventory,
): PublicCatalog {
  const catalog = publicCatalogSchema.parse(input) as PublicCatalog;
  const problems = findInventoryProblems(catalog, expected);

  // Record checks run against the RAW input: Zod strips unknown keys, so a
  // smuggled commercial field would be invisible on the parsed output.
  const seenIds = new Set<string>();
  const seenSlugs = new Set<string>();
  for (const product of rawProductsOf(input)) {
    const id = String(product["id"] ?? "<unknown>");
    const slug = String(product["slug"] ?? "<unknown>");
    if (seenIds.has(id)) problems.push(`duplicate product id: ${id}`);
    if (seenSlugs.has(slug)) problems.push(`duplicate product slug: ${slug}`);
    seenIds.add(id);
    seenSlugs.add(slug);
    if ((RETIRED_PRODUCT_SLUGS as readonly string[]).includes(slug)) {
      problems.push(`retired product present: ${slug}`);
    }
    problems.push(...findRecordProblems(product));
  }

  if (problems.length > 0) {
    throw new Error(`Catalogue contract violated:\n- ${problems.join("\n- ")}`);
  }

  return catalog;
}

/** Compares the projection with the explicit expected inventory. */
export function findInventoryProblems(
  catalog: PublicCatalog,
  expected: ExpectedInventory,
): string[] {
  const problems: string[] = [];
  const { products } = catalog;

  if (products.length !== expected.productCount) {
    problems.push(`expected exactly ${expected.productCount} products, found ${products.length}`);
  }
  if (expected.productIds.length !== expected.productCount) {
    problems.push("sync record productIds length disagrees with productCount");
  }

  const actualIds = new Set(products.map((product) => product.id));
  for (const id of expected.productIds) {
    if (!actualIds.has(id)) problems.push(`expected product missing: ${id}`);
  }
  for (const id of actualIds) {
    if (!expected.productIds.includes(id)) problems.push(`unexpected product: ${id}`);
  }

  const actualByType: Record<string, number> = {};
  for (const product of products) {
    actualByType[product.productType] = (actualByType[product.productType] ?? 0) + 1;
  }
  const types = new Set([...Object.keys(actualByType), ...Object.keys(expected.productCountsByType)]);
  for (const type of types) {
    const want = expected.productCountsByType[type] ?? 0;
    const got = actualByType[type] ?? 0;
    if (want !== got) problems.push(`expected ${want} ${type} products, found ${got}`);
  }

  return problems;
}

/** Contract problems for a single raw catalogue record. */
export function findRecordProblems(record: Record<string, unknown> | Product): string[] {
  const product = record as Record<string, unknown>;
  const problems: string[] = [];
  const label = String(product["id"] ?? "<unknown>");

  for (const field of FORBIDDEN_PRODUCT_FIELDS) {
    if (field in product) problems.push(`${label}: forbidden field "${field}"`);
  }

  for (const key of Object.keys(product)) {
    if (!(CANONICAL_PRODUCT_FIELDS as readonly string[]).includes(key)) {
      problems.push(`${label}: unexpected field "${key}" outside the canonical contract`);
    }
  }

  const serialized = JSON.stringify(product);
  if (serialized.length > MAX_RECORD_JSON_CHARS) {
    problems.push(
      `${label}: record is ${serialized.length} chars, over the ${MAX_RECORD_JSON_CHARS} metadata limit (payload leak?)`,
    );
  }

  for (const [key, value] of Object.entries(product)) {
    for (const text of stringsIn(value)) {
      if (text.length > MAX_FIELD_CHARS) {
        problems.push(`${label}.${key}: string of ${text.length} chars exceeds metadata limit`);
      }
      if (PAYLOAD_MARKERS.some((marker) => marker.test(text))) {
        problems.push(`${label}.${key}: contains raw prompt payload markup`);
      }
    }
  }

  return problems;
}

function stringsIn(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(stringsIn);
  return [];
}

function rawProductsOf(input: unknown): Record<string, unknown>[] {
  const products = (input as { products?: unknown } | null)?.products;
  if (!Array.isArray(products)) return [];
  return products.filter(
    (item): item is Record<string, unknown> => typeof item === "object" && item !== null,
  );
}