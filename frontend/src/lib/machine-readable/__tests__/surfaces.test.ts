import { describe, expect, it } from "vitest";
import { listProducts } from "@/domain/catalog/repository";
import { catalogSource } from "@/domain/catalog/source";
const CANONICAL_PRODUCT_COUNT = catalogSource.productCount;
import { buildProductJsonLd } from "@/lib/jsonld/product";
import { buildCatalogJson } from "../catalog";
import { buildLlmsTxt } from "../llms";
import { buildProductMarkdown } from "../product-markdown";

const products = listProducts();
const catalogJson = buildCatalogJson() as {
  productCount: number;
  products: { slug: string; detailUrl: string; rawUrl: string }[];
};
const llmsTxt = buildLlmsTxt();
const slugs = products.map((product) => product.slug);

const PAYLOAD_MARKERS = ["```", "## System role", "PROMPT.md content"];

describe("machine-readable surfaces derive from the canonical synced records", () => {
  it("catalog.json publishes every canonical product and nothing else", () => {
    expect(catalogJson.productCount).toBe(CANONICAL_PRODUCT_COUNT);
    expect(catalogJson.products.map((product) => product.slug).sort()).toEqual([...slugs].sort());
    for (const product of catalogJson.products) {
      expect(product.detailUrl).toBe(`/products/${product.slug}`);
      expect(product.rawUrl).toBe(`/raw/products/${product.slug}.md`);
    }
  });

  it("llms.txt reports the canonical count and lists every product", () => {
    expect(llmsTxt).toContain(`- products: ${CANONICAL_PRODUCT_COUNT}`);
    for (const product of products) expect(llmsTxt).toContain(product.name);
  });

  it("raw markdown resolves for every canonical slug", () => {
    for (const product of products) {
      const markdown = buildProductMarkdown(product);
      expect(markdown).toContain(`# ${product.name}`);
      expect(markdown).toContain(product.summary);
    }
  });

  it("does not reference the retired Audiogram product anywhere", () => {
    expect(JSON.stringify(catalogJson).toLowerCase()).not.toContain("audiogram");
    expect(llmsTxt.toLowerCase()).not.toContain("audiogram");
    expect(slugs).not.toContain("audiogram");
  });
});

describe("no raw prompt body is exposed", () => {
  it("catalog.json and llms.txt carry metadata only", () => {
    const serialized = JSON.stringify(catalogJson);
    for (const marker of PAYLOAD_MARKERS) {
      expect(serialized).not.toContain(marker);
      expect(llmsTxt).not.toContain(marker);
    }
  });

  it("raw markdown exposes only allowed catalogue fields", () => {
    for (const product of products) {
      const markdown = buildProductMarkdown(product);
      expect(markdown).not.toContain("```");
      expect(markdown).toContain("the full prompt body are not published");
      // sourcePath is a pointer to upstream payload, never the payload itself.
      if (product.sourcePath) expect(markdown).toContain(product.sourcePath);
      expect(markdown.length).toBeLessThan(6_000);
    }
  });

  it("product JSON-LD publishes only description-level fields", () => {
    for (const product of products) {
      const jsonLd = buildProductJsonLd(product) as Record<string, unknown>;
      expect(jsonLd["@type"]).toBe("Product");
      expect(jsonLd["name"]).toBe(product.name);
      expect(jsonLd["description"]).toBe(product.summary);
      expect(jsonLd).not.toHaveProperty("offers");
      expect(jsonLd).not.toHaveProperty("aggregateRating");
      expect(jsonLd).not.toHaveProperty("review");
      expect(JSON.stringify(jsonLd)).not.toContain("```");
    }
  });
});