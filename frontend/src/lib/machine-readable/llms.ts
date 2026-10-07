/**
 * /llms.txt orientation file. Plain text, derived from the catalogue.
 */

import { catalogMeta, listCategories, listProducts } from "@/domain/catalog/repository";
import { categoryLabel } from "@/domain/catalog/facets";
import { PRODUCT_HEADLINE, SITE_DESCRIPTOR } from "@/lib/site";

export function buildLlmsTxt(): string {
  const lines: string[] = [
    `# ${SITE_DESCRIPTOR} (descriptor, not a brand)`,
    "",
    PRODUCT_HEADLINE,
    "",
    "## Catalogue",
    `- schemaVersion: ${catalogMeta.schemaVersion}`,
    `- products: ${catalogMeta.productCount}`,
    "- full catalogue: /catalog.json",
    "- per-product markdown: /raw/products/{slug}.md",
    "",
    "## Data policy",
    "- No prices, ratings, reviews or sales figures are published; none are authoritatively available.",
    "- Full raw prompt bodies are not exposed.",
    "- Missing fields are omitted rather than fabricated.",
    "",
    "## Agent interface",
    "- Planned interface is a CLI: shop search | show | sample | buy | install | update.",
    "- Status: documented, not implemented. MCP is out of scope.",
    "",
    "## Categories",
    ...listCategories().map((category) => `- ${categoryLabel(category)} (${category})`),
    "",
    "## Products",
  ];

  for (const product of listProducts()) {
    lines.push(
      `- ${product.name} [${product.productType}] — ${product.summary} (/raw/products/${product.slug}.md)`,
    );
  }

  return `${lines.join("\n")}\n`;
}