import { describe, expect, it } from "vitest";
import { catalogMeta, getProductBySlug, listCategories, listProducts } from "../repository";
import { catalogSource } from "../source";

const CANONICAL_PRODUCT_COUNT = catalogSource.productCount;

describe("catalog repository", () => {
  it("loads the canonical, validated catalogue matching the sync record", () => {
    expect(catalogMeta.productCount).toBe(CANONICAL_PRODUCT_COUNT);
    expect(listProducts()).toHaveLength(CANONICAL_PRODUCT_COUNT);
  });

  it("names the canonical upstream repository as the source authority", () => {
    expect(catalogSource.upstream.repository).toBe("AyobamiH/agent-shop-products");
    expect(catalogSource.upstream.branch).toBe("main");
    expect(catalogSource.localRole).toBe("synced-projection");
    expect(catalogMeta.upstreamRepository).toBe("AyobamiH/agent-shop-products");
  });

  it("exposes unique slugs and ids", () => {
    const slugs = new Set(listProducts().map((product) => product.slug));
    const ids = new Set(listProducts().map((product) => product.id));
    expect(slugs.size).toBe(CANONICAL_PRODUCT_COUNT);
    expect(ids.size).toBe(CANONICAL_PRODUCT_COUNT);
  });

  it("resolves products by slug and returns undefined for unknown slugs", () => {
    const first = listProducts()[0]!;
    expect(getProductBySlug(first.slug)?.id).toBe(first.id);
    expect(getProductBySlug("does-not-exist")).toBeUndefined();
  });

  it("no longer carries the retired Audiogram record", () => {
    expect(getProductBySlug("audiogram")).toBeUndefined();
    expect(listProducts().some((product) => /audiogram/i.test(product.id))).toBe(false);
  });

  it("uses the canonical `tags` field and publishes no commercial fields", () => {
    for (const product of listProducts()) {
      expect(Array.isArray(product.tags)).toBe(true);
      expect(product).not.toHaveProperty("catalogTags");
      expect(product).not.toHaveProperty("provenance");
      expect(product).not.toHaveProperty("price");
      expect(product).not.toHaveProperty("rating");
      expect(product).not.toHaveProperty("reviews");
    }
  });

  it("points every source path at the canonical repository layout", () => {
    for (const product of listProducts()) {
      if (product.sourcePath) expect(product.sourcePath).toMatch(/^products\/[a-z0-9-]+\//);
    }
  });

  it("derives categories from the catalogue", () => {
    expect(listCategories().length).toBeGreaterThan(0);
  });
});