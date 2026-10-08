import { catalogMeta } from "@/domain/catalog/repository";
import { catalogSource } from "@/domain/catalog/source";
import { absoluteUrl, SITE_DESCRIPTOR } from "@/lib/site";
import { SUBCONTRACTING_CAPABILITY_SLUG, SUBCONTRACTING_PROVIDER_NAME, SUBCONTRACTING_SERVICE_GUIDE, SUBCONTRACTING_SERVICE_CATALOGUE } from "@/features/agent-discovery/subcontracting-source";

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
    "## Distinct service implementation route",
    `source-backed capability: ${absoluteUrl(`/products/${SUBCONTRACTING_CAPABILITY_SLUG}`)}`,
    `external provider: ${SUBCONTRACTING_PROVIDER_NAME}`,
    `provider agent guide: ${SUBCONTRACTING_SERVICE_GUIDE}`,
    `provider live service catalogue: ${SUBCONTRACTING_SERVICE_CATALOGUE}`,
    "- Agent Shop provides capability metadata only; it does not accept paid jobs, issue quotes, grant repository access or execute purchases.",
    "- Verify the provider's live contract independently. Receipt, owner acceptance, price, payment and completion are separate evidence states.",
    "",
    "## Crawl policy",
    "- Public discovery routes are intended to be crawlable and indexable.",
    `robots: ${absoluteUrl("/robots.txt")}`,
    `sitemap: ${absoluteUrl("/sitemap.xml")}`,
    "",
  ].join("\n");
}
