import { catalogMeta, listCategories, listProducts } from "@/domain/catalog/repository";
import { catalogSource } from "@/domain/catalog/source";
import { categoryLabel } from "@/domain/catalog/facets";
import { absoluteUrl, PRODUCT_HEADLINE, SITE_DESCRIPTOR } from "@/lib/site";

export function buildLlmsTxt(): string {
  const counts = Object.entries(catalogSource.productCountsByType)
    .map(([type, count]) => `${type}=${count}`)
    .join(", ");

  const lines: string[] = [
    `# ${SITE_DESCRIPTOR} (descriptor, not a brand)`,
    "",
    PRODUCT_HEADLINE,
    "This file is a convenience index for language-model and tool consumers; it is not claimed as a universal protocol.",
    "",
    "## Discovery",
    `- agent guide: ${absoluteUrl("/agents")}`,
    `- agent discovery text: ${absoluteUrl("/agents.txt")}`,
    `- canonical catalogue: ${absoluteUrl("/catalog.json")}`,
    `- per-product metadata: ${absoluteUrl("/raw/products/{slug}.md")}`,
    "",
    "## Catalogue",
    `- schemaVersion: ${catalogMeta.schemaVersion}`,
    `- products: ${catalogMeta.productCount}`,
    `- types: ${counts}`,
    "",
    "## Data policy",
    "- Public records are source-backed metadata.",
    "- No prices, ratings, reviews, compatibility or sales figures are invented.",
    "- Full PROMPT.md and SKILL.md payload bodies are withheld.",
    "- Missing fields are omitted rather than fabricated.",
    "",
    "## Agent interface",
    "- HTTP discovery is available now through the endpoints above.",
    "- CLI search/show/sample/buy/install/update is roadmap only.",
    "- MCP is out of scope.",
    "",
    "## Categories",
    ...listCategories().map((category) => `- ${categoryLabel(category)} (${category})`),
    "",
    "## Products",
  ];

  for (const product of listProducts()) {
    lines.push(
      `- ${product.name} [${product.productType}] — ${product.summary} (${absoluteUrl(`/raw/products/${product.slug}.md`)})`,
    );
  }

  return `${lines.join("\n")}\n`;
}
