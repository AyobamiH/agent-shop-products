import { describe, expect, it } from "vitest";
import { toFilters, toSearchParams, validateCatalogSearch } from "../lib/search-params";

describe("catalog search params", () => {
  it("drops empty and duplicate values", () => {
    expect(validateCatalogSearch({ q: "", tag: "a,,a, b" })).toEqual({
      q: undefined,
      type: undefined,
      category: undefined,
      tag: "a,b",
    });
  });

  it("ignores product types outside the canonical set", () => {
    expect(toFilters({ type: "prompt,not-a-type" }).productTypes).toEqual(["prompt"]);
  });

  it("round-trips filters through the URL projection", () => {
    const filters = {
      text: "verification",
      categories: ["debugging"],
      productTypes: ["skill"] as const,
      tags: ["evidence", "ci"],
    };
    expect(toFilters(toSearchParams(filters))).toEqual(filters);
  });
});