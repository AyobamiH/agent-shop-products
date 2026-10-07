import { catalogMeta } from "@/domain/catalog/repository";
import { catalogSource } from "@/domain/catalog/source";
import { absoluteUrl, SITE_DESCRIPTOR } from "@/lib/site";

export function buildAgentsTxt(): string {
  const counts = Object.entries(catalogSource.productCountsByType)
    .map(([type, count]) => `${type}=${count}`)
    .join(", ");

  return [
    `# ${SITE_DESCRIPTOR}`,
    "",
    "Purpose: source-backed capability discovery for autonomous and tool-using agents.",
    "Audience: agents. The HTML interface is an inspectable projection of the same catalogue.",
    "Status: site-specific discovery document; not claimed as a universal standard.",
    "",
    "## Canonical discovery",
    `catalog: ${absoluteUrl("/catalog.json")}`,
    `agent guide: ${absoluteUrl("/agents")}`,
    `llm convenience index: ${absoluteUrl("/llms.txt")}`,
    `product detail template: ${absoluteUrl("/products/{slug}")}`,
    `metadata markdown template: ${absoluteUrl("/raw/products/{slug}.md")}`,
    `problems: ${absoluteUrl("/problems")}`,
    `knowledge: ${absoluteUrl("/knowledge")}`,
    "",
    "## Inventory",
    `products: ${catalogMeta.productCount}`,
    `types: ${counts}`,
    `schemaVersion: ${catalogMeta.schemaVersion}`,
    "",
    "## Source boundary",
    `authority: https://github.com/${catalogSource.upstream.repository}`,
    `projection: ${catalogSource.upstream.publicProjectionPath}`,
    "- Public records expose metadata only: summary, problem, outcomes, requirements, boundaries, tags and source pointers.",
    "- Full PROMPT.md and SKILL.md payload bodies are not exposed.",
    "- Missing price, rating, review, compatibility and evidence fields are omitted rather than invented.",
    "",
    "## Agent interface",
    "- Current: HTTP GET discovery surfaces listed above.",
    "- Future CLI: search, show, sample, buy, install, update.",
    "- buy/install/update are roadmap only; this frontend does not execute commerce or installation.",
    "- MCP is out of scope for this product.",
    "",
    "## Crawl policy",
    "- Public discovery routes are intended to be crawlable and indexable.",
    `robots: ${absoluteUrl("/robots.txt")}`,
    `sitemap: ${absoluteUrl("/sitemap.xml")}`,
    "",
  ].join("\n");
}
