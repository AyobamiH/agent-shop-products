import { describe, expect, it } from "vitest";
import { describeFilters } from "../lib/announce";

const EMPTY = { text: "", categories: [], productTypes: [], tags: [] } as const;

describe("describeFilters", () => {
  it("announces the cleared state", () => {
    expect(describeFilters(EMPTY, 12)).toBe("Filters cleared. Showing all 12 products.");
  });

  it("announces active filters and the result count", () => {
    expect(
      describeFilters(
        {
          text: " verification ",
          categories: ["debugging"],
          productTypes: ["skill"],
          tags: ["ci"],
        },
        1,
      ),
    ).toBe(
      'Filtered by search "verification"; type skill; category debugging; tags ci. 1 product shown.',
    );
  });
});