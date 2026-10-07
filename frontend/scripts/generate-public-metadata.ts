import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

type Product = {
  id: string;
  slug: string;
  name: string;
  productType: string;
  category: string;
  summary: string;
  problem: string;
  coreOutcomes: string[];
  requirements: string[];
  boundaries: string[];
  tags: string[];
  sourcePath?: string;
};

type SourceRecord = {
  upstream: { repository: string; branch: string };
};

const ROOT = resolve(import.meta.dirname, "..");
const catalog = JSON.parse(
  readFileSync(resolve(ROOT, "catalog/products.public.json"), "utf8"),
) as { products: Product[] };
const source = JSON.parse(
  readFileSync(resolve(ROOT, "catalog/source.json"), "utf8"),
) as SourceRecord;
const outputDir = resolve(ROOT, "public/raw/products");
const origin = (process.env.VITE_SITE_ORIGIN ?? "http://localhost:8080").replace(/\/+$/, "");

rmSync(outputDir, { recursive: true, force: true });
mkdirSync(outputDir, { recursive: true });

for (const product of catalog.products) {
  const lines = [
    `# ${product.name}`,
    "",
    `- id: ${product.id}`,
    `- type: ${product.productType}`,
    `- category: ${product.category}`,
    `- detail: ${origin}/products/${product.slug}`,
    "",
    "## Summary",
    product.summary,
    "",
    "## Problem",
    product.problem,
    ...section("Core outcomes", product.coreOutcomes),
    ...section("Requirements", product.requirements),
    ...section("Boundaries", product.boundaries),
    ...section("Tags", product.tags),
  ];

  if (product.sourcePath) {
    lines.push(
      "",
      "## Canonical source",
      `- repository: ${source.upstream.repository} (${source.upstream.branch})`,
      `- payload path: ${product.sourcePath}`,
    );
  }

  lines.push(
    "",
    "## Not published",
    "Price, ratings, reviews, sales figures and full PROMPT.md / SKILL.md payload bodies are not published.",
  );

  writeFileSync(resolve(outputDir, `${product.slug}.md`), `${lines.join("\n")}\n`);
}

console.log(`raw metadata: generated ${catalog.products.length} Markdown files`);

function section(heading: string, values: readonly string[]): string[] {
  if (values.length === 0) return [];
  return ["", `## ${heading}`, ...values.map((value) => `- ${value}`)];
}
