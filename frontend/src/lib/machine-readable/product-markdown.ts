/**
 * /raw/products/{slug}.md projection: catalogue metadata only.
 * Full prompt bodies are deliberately withheld.
 */

import { categoryLabel } from "@/domain/catalog/facets";
import { catalogSource } from "@/domain/catalog/source";
import type { Product } from "@/domain/catalog/types";

export function buildProductMarkdown(product: Product): string {
  const sections: string[] = [
    `# ${product.name}`,
    "",
    `- id: ${product.id}`,
    `- type: ${product.productType}`,
    `- category: ${categoryLabel(product.category)} (${product.category})`,
    `- detail: /products/${product.slug}`,
    "",
    "## Summary",
    product.summary,
    "",
    "## Problem",
    product.problem,
    ...list("Core outcomes", product.coreOutcomes),
    ...list("Requirements", product.requirements),
    ...list("Boundaries", product.boundaries),
    ...list("Tags", product.tags),
  ];

  if (product.sourcePath) {
    sections.push(
      "",
      "## Canonical source",
      `- repository: ${catalogSource.upstream.repository} (${catalogSource.upstream.branch})`,
      `- payload path: ${product.sourcePath}`,
    );
  }

  sections.push(
    "",
    "## Not published",
    "Price, ratings, reviews, sales figures and the full prompt body are not published.",
  );

  return `${sections.join("\n")}\n`;
}

function list(heading: string, values: readonly string[]): string[] {
  if (values.length === 0) return [];
  return ["", `## ${heading}`, ...values.map((value) => `- ${value}`)];
}