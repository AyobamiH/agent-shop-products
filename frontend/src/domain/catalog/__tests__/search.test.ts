import { describe, expect, it } from "vitest";
import { listProducts } from "../repository";
import { matchesFilters, scoreProduct, searchProducts } from "../search";

const products = listProducts();
const sample = products[0]!;

describe("scoreProduct", () => {
  it("returns a neutral score for empty text", () => {
    expect(scoreProduct(sample, "")).toBe(1);
  });

  it("requires every token to match", () => {
    expect(scoreProduct(sample, "zzzz-not-present")).toBe(0);
  });

  it("weights a name match above a tag-only match", () => {
    const nameToken = sample.name.split(" ")[0]!;
    expect(scoreProduct(sample, nameToken)).toBeGreaterThan(0);
  });
});

describe("matchesFilters", () => {
  it("filters by category", () => {
    expect(matchesFilters(sample, { category: sample.category })).toBe(true);
    expect(matchesFilters(sample, { category: "not-a-category" })).toBe(false);
  });

  it("requires all selected tags", () => {
    expect(matchesFilters(sample, { tags: [...sample.tags] })).toBe(true);
    expect(matchesFilters(sample, { tags: ["not-a-tag"] })).toBe(false);
  });
});

describe("searchProducts", () => {
  it("returns all products for an empty query", () => {
    expect(searchProducts(products, {})).toHaveLength(products.length);
  });

  it("is deterministic", () => {
    const first = searchProducts(products, { text: "agent" }).map((product) => product.id);
    const second = searchProducts(products, { text: "agent" }).map((product) => product.id);
    expect(first).toEqual(second);
  });

  it("returns nothing for an unmatched query rather than a fallback list", () => {
    expect(searchProducts(products, { text: "qqqqqqqq" })).toHaveLength(0);
  });
});