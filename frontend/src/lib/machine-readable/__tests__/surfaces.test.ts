import { describe, expect, it } from "vitest";
import { listProducts } from "@/domain/catalog/repository";
import { catalogSource } from "@/domain/catalog/source";
import { buildProductJsonLd } from "@/lib/jsonld/product";
import { absoluteUrl } from "@/lib/site";
import { buildAgentsTxt } from "../agents";
import { SUBCONTRACTING_CAPABILITY_SLUG, SUBCONTRACTING_SERVICE_GUIDE, SUBCONTRACTING_SERVICE_CATALOGUE } from "@/features/agent-discovery/subcontracting-source";
import { buildCatalogJson } from "../catalog";
import { buildLlmsTxt } from "../llms";
import { buildProductMarkdown } from "../product-markdown";
import { buildRobotsTxt, EXPLICIT_CRAWLER_ALLOWLIST } from "../robots";

const products = listProducts();
const skills = products.filter((product) => product.productType === "skill");
const catalogJson = buildCatalogJson() as { productCount: number; products: { slug: string; detailUrl: string; rawUrl: string }[] };
const llmsTxt = buildLlmsTxt();
const agentsTxt = buildAgentsTxt();

describe("agent discovery surfaces", () => {
  it("publishes every canonical product with absolute discovery URLs", () => {
    expect(catalogJson.productCount).toBe(catalogSource.productCount);
    expect(catalogJson.products).toHaveLength(catalogSource.productCount);
    for (const product of catalogJson.products) {
      expect(product.detailUrl).toBe(absoluteUrl("/products/" + product.slug));
      expect(product.rawUrl).toBe(absoluteUrl("/raw/products/" + product.slug + ".md"));
    }
  });

  it("keeps all current skill records discoverable", () => {
    expect(skills.length).toBe(catalogSource.productCountsByType["skill"]);
    expect(skills.length).toBeGreaterThan(0);
    for (const skill of skills) {
      expect(JSON.stringify(catalogJson)).toContain(skill.name);
      expect(llmsTxt).toContain(skill.name);
      expect(buildProductMarkdown(skill)).toContain("- type: skill");
    }
  });

  it("publishes explicit agent and crawler guidance", () => {
    expect(agentsTxt).toContain("autonomous and tool-using agents");
    expect(agentsTxt).toContain(absoluteUrl("/catalog.json"));
    expect(agentsTxt).toContain("MCP is out of scope");
    expect(llmsTxt).toContain("convenience index");
    const robots = buildRobotsTxt();
    for (const crawler of EXPLICIT_CRAWLER_ALLOWLIST) {
      expect(robots).toContain("User-agent: " + crawler);
    }
    expect(robots).toContain("User-agent: *");
    expect(robots).toContain("Allow: /");
    expect(robots).toContain("Sitemap: " + absoluteUrl("/sitemap.xml"));
  });

  it("separates the supported subcontracting provider from catalogue transaction authority", () => {
    const record = products.find((product) => product.slug === SUBCONTRACTING_CAPABILITY_SLUG);
    expect(record?.name).toBe("Agent Subcontracting Commercial Handoff");
    expect(agentsTxt).toContain(absoluteUrl(`/products/${SUBCONTRACTING_CAPABILITY_SLUG}`));
    expect(agentsTxt).toContain(SUBCONTRACTING_SERVICE_GUIDE);
    expect(agentsTxt).toContain(SUBCONTRACTING_SERVICE_CATALOGUE);
    expect(agentsTxt).toContain("does not accept paid jobs, issue quotes");
    expect(agentsTxt).toContain("Receipt, owner acceptance, price, payment and completion");
    expect(JSON.stringify(catalogJson)).not.toContain(SUBCONTRACTING_SERVICE_CATALOGUE);
  });

  it("withholds full prompt and skill payload bodies", () => {
    const combined = JSON.stringify(catalogJson) + llmsTxt + agentsTxt;
    for (const marker of ["```", "## System role", "<system>", "---\nname:"]) expect(combined).not.toContain(marker);
    for (const product of products) {
      const markdown = buildProductMarkdown(product);
      expect(markdown).toContain("PROMPT.md / SKILL.md payload bodies are not published");
    }
  });

  it("uses truthful non-commerce structured data", () => {
    for (const product of products) {
      const node = buildProductJsonLd(product) as Record<string, unknown>;
      expect(node["@type"]).toBe("CreativeWork");
      expect(node["url"]).toBe(absoluteUrl("/products/" + product.slug));
      expect(node).not.toHaveProperty("offers");
      expect(node).not.toHaveProperty("aggregateRating");
      expect(node).not.toHaveProperty("review");
    }
  });
});
