import { describe, expect, it } from "vitest";
import { getProductBySlug } from "@/domain/catalog/repository";
import { COMMERCIAL_PATHS, SOLUTION_TRACKS } from "./decision";

describe("problem-led discovery and commerce authority", () => {
  it("has independently named, source-backed problem paths", () => {
    expect(SOLUTION_TRACKS.length).toBeGreaterThanOrEqual(3);
    expect(new Set(SOLUTION_TRACKS.map((track) => track.id)).size).toBe(SOLUTION_TRACKS.length);
    for (const track of SOLUTION_TRACKS) {
      expect(track.title.length).toBeGreaterThan(24);
      expect(track.symptom.length).toBeGreaterThan(70);
      expect(track.checks.length).toBeGreaterThanOrEqual(3);
      expect(track.productSlugs.length).toBeGreaterThanOrEqual(3);
      for (const slug of track.productSlugs) {
        expect(getProductBySlug(slug), "Not in canonical source: " + slug).toBeDefined();
      }
    }
  });

  it("never invents an active kit, bundle, digital licence or unapproved price", () => {
    expect(COMMERCIAL_PATHS.map((path) => path.availability)).toEqual([
      "available_reference",
      "not_for_sale",
      "not_for_sale",
      "quote_first",
    ]);
    for (const path of COMMERCIAL_PATHS) {
      expect("price" in path).toBe(false);
      expect("stripePriceId" in path).toBe(false);
      expect("checkoutUrl" in path).toBe(false);
      if (path.availability === "not_for_sale") {
        expect("actionPath" in path).toBe(false);
      }
    }
  });

  it("provides working local navigation only for public reference or quote-first service", () => {
    const paths = COMMERCIAL_PATHS.filter((path) => "actionPath" in path);
    expect(paths.map((path) => path.actionPath)).toEqual(["/shop", "/integration-services"]);
  });
});
