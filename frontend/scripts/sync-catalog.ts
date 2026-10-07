import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const FRONTEND_ROOT = resolve(import.meta.dirname, "..");
const REPO_ROOT = resolve(FRONTEND_ROOT, "..");
const upstreamPath = resolve(REPO_ROOT, "catalog/products.public.json");
const localPath = resolve(FRONTEND_ROOT, "catalog/products.public.json");
const sourcePath = resolve(FRONTEND_ROOT, "catalog/source.json");

const upstreamText = readFileSync(upstreamPath, "utf8");
const localText = readFileSync(localPath, "utf8");
const catalog = JSON.parse(upstreamText) as { products: Array<{ id: string; productType: string }> };
const source = JSON.parse(readFileSync(sourcePath, "utf8")) as Record<string, unknown>;
const counts: Record<string, number> = {};
for (const product of catalog.products) counts[product.productType] = (counts[product.productType] ?? 0) + 1;

if (JSON.stringify(JSON.parse(localText)) !== JSON.stringify(JSON.parse(upstreamText))) {
  source.syncedOn = new Date().toISOString().slice(0, 10);
}
source.productCount = catalog.products.length;
source.productCountsByType = Object.fromEntries(Object.entries(counts).sort());
source.productIds = catalog.products.map((product) => product.id).sort();

writeFileSync(localPath, upstreamText);
writeFileSync(sourcePath, JSON.stringify(source, null, 2) + "\n");
console.log("catalog sync:", catalog.products.length, counts);
