import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { catalogSource } from "../source";
import {
  findRecordProblems,
  validateCanonicalCatalog,
} from "../validation";

const CANONICAL_PRODUCT_COUNT = catalogSource.productCount;

const rawCatalog = JSON.parse(
  readFileSync(resolve(process.cwd(), "catalog/products.public.json"), "utf8"),
) as { products: Record<string, unknown>[] };

describe("catalogue contract (build-time gate)", () => {
  it("validates the bundled projection against the explicit sync record", () => {
    const catalog = validateCanonicalCatalog(rawCatalog, catalogSource);
    expect(catalog.products).toHaveLength(CANONICAL_PRODUCT_COUNT);
  });

  it("keeps the sync record aligned with the projection", () => {
    expect(catalogSource.upstream.repository).toBe("AyobamiH/agent-shop-products");
    expect(rawCatalog.products).toHaveLength(CANONICAL_PRODUCT_COUNT);
  });

  it("rejects a projection whose product count drifts", () => {
    const drifted = { ...rawCatalog, products: rawCatalog.products.slice(0, 10) };
    expect(() => validateCanonicalCatalog(drifted, catalogSource)).toThrow(/expected exactly \d+ products/);
  });

  it("keeps sync-record counts internally consistent", () => {
    const totalByType = Object.values(catalogSource.productCountsByType).reduce(
      (sum, count) => sum + count,
      0,
    );
    expect(totalByType).toBe(catalogSource.productCount);
    expect(catalogSource.productIds).toHaveLength(catalogSource.productCount);
    expect(catalogSource.productCountsByType.skill ?? 0).toBeGreaterThan(0);
  });

  it("rejects a projection whose type mix drifts", () => {
    const drifted = {
      ...rawCatalog,
      products: rawCatalog.products.map((p, i) => (i === 0 ? { ...p, productType: "skill" } : p)),
    };
    expect(() => validateCanonicalCatalog(drifted, catalogSource)).toThrow(/skill products/);
  });

  it("rejects SKILL.md front matter smuggled into a record", () => {
    const problems = findRecordProblems({ id: "x", summary: "---\nname: x\ndescription: y" });
    expect(problems.some((problem) => problem.includes("payload"))).toBe(true);
  });

  it("rejects fabricated commercial fields", () => {
    expect(findRecordProblems({ id: "x", price: 49 })).toContain('x: forbidden field "price"');
    expect(findRecordProblems({ id: "x", rating: 5 })).toContain('x: forbidden field "rating"');
    expect(findRecordProblems({ id: "x", evidenceLevel: "high" })).toContain(
      'x: forbidden field "evidenceLevel"',
    );
  });

  it("rejects raw prompt payload smuggled into a record", () => {
    const problems = findRecordProblems({
      id: "x",
      summary: "## System role\n\nYou are an agent.\n\n```\nrun\n```",
    });
    expect(problems.some((problem) => problem.includes("raw prompt payload"))).toBe(true);
  });
});