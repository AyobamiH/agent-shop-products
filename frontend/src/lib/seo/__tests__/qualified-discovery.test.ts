import { describe, expect, it } from "vitest";
import { listProducts } from "@/domain/catalog/repository";
import { buildPageHead, INDEXABLE_ROBOTS, REFERENCE_ONLY_ROBOTS } from "@/lib/seo/meta";
import { absoluteUrl } from "@/lib/site";
import { indexableSitemapPaths } from "@/routes/sitemap[.]xml";

describe("qualified discovery", () => {
  it("indexes all original products and every approved collection/service page", () => {
    const paths = indexableSitemapPaths();
    expect(new Set(paths).size).toBe(paths.length);
    for (const product of listProducts()) {
      expect(paths).toContain("/products/" + product.slug);
    }
    const approvedCollections = [
      "/",
      "/shop",
      "/agents",
      "/problems",
      "/knowledge",
      "/capabilities",
      "/coding-bugs",
      "/integration-services",
      "/solutions",
    ];
    for (const path of approvedCollections) {
      expect(paths).toContain(path);
    }
    expect(paths.length).toBe(listProducts().length + approvedCollections.length);
  });

  it("excludes names-only references and machine files from the Google sitemap", () => {
    for (const path of indexableSitemapPaths()) {
      expect(path.startsWith("/capabilities/")).toBe(false);
      expect(path.startsWith("/raw/")).toBe(false);
      expect(path.endsWith(".json") || path.endsWith(".txt") || path.endsWith(".md")).toBe(false);
    }
  });

  it("keeps references discoverable but not Google-indexable", () => {
    const detail = buildPageHead({
      title: "External tool metadata",
      description: "Names-only reference.",
      path: "/capabilities/tool-example",
      indexable: false,
    });
    expect(detail.meta.find((tag) => tag.name === "robots")?.content).toBe(REFERENCE_ONLY_ROBOTS);
    expect(detail.links).toContainEqual({
      rel: "canonical",
      href: absoluteUrl("/capabilities/tool-example"),
    });
    const original = buildPageHead({
      title: "Original procedure",
      description: "Source-backed original work.",
      path: "/products/example",
    });
    expect(original.meta.find((tag) => tag.name === "robots")?.content).toBe(INDEXABLE_ROBOTS);
  });

  it("keeps the commercial service indexable but does not advertise fake purchase offers", () => {
    const page = buildPageHead({
      title: "Scoped implementation",
      description: "A feasibility review and quote-first service.",
      path: "/integration-services",
    });
    expect(page.meta.find((tag) => tag.name === "robots")?.content).toBe(INDEXABLE_ROBOTS);
    expect(JSON.stringify(page)).not.toContain('"offers"');
  });
});
