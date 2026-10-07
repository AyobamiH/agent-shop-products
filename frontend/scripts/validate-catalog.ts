/**
 * Build-time catalogue gate.
 *
 * Runs before `vite build` (see package.json). Fails the build when the synced
 * projection drifts from the explicit expected inventory in catalog/source.json
 * (count, per-type counts, ids), gains fabricated commercial fields, or carries
 * raw PROMPT.md / SKILL.md payload.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { validateCanonicalCatalog, type ExpectedInventory } from "../src/domain/catalog/validation";

const ROOT = resolve(import.meta.dirname, "..");

type SourceRecord = ExpectedInventory & {
  localRole?: string;
  upstream?: { repository?: string; branch?: string };
};

function readJson(relativePath: string): unknown {
  return JSON.parse(readFileSync(resolve(ROOT, relativePath), "utf8"));
}

function main(): void {
  const sourceRecord = readJson("catalog/source.json") as SourceRecord;

  if (sourceRecord.upstream?.repository !== "AyobamiH/agent-shop-products") {
    throw new Error(
      `catalog/source.json must name AyobamiH/agent-shop-products as upstream authority, found "${sourceRecord.upstream?.repository}"`,
    );
  }
  if (sourceRecord.localRole !== "synced-projection") {
    throw new Error('catalog/source.json must declare localRole "synced-projection"');
  }
  if (!Array.isArray(sourceRecord.productIds) || !sourceRecord.productCountsByType) {
    throw new Error("catalog/source.json must declare productIds and productCountsByType");
  }

  const catalog = validateCanonicalCatalog(readJson("catalog/products.public.json"), sourceRecord);
  const byType = Object.entries(sourceRecord.productCountsByType)
    .map(([type, count]) => `${count} ${type}`)
    .join(", ");

  console.log(
    `catalog: ${catalog.products.length} canonical products (${byType}) validated against the sync record (upstream ${sourceRecord.upstream.repository}@${sourceRecord.upstream.branch}).`,
  );
}

try {
  main();
} catch (error) {
  console.error(`\nCatalogue validation failed.\n${(error as Error).message}\n`);
  process.exit(1);
}