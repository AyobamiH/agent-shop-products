import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const origin = (process.env.ACCEPTANCE_ORIGIN ?? "").replace(/\/+$/, "");
if (!origin) throw new Error("ACCEPTANCE_ORIGIN is required");

const root = resolve(import.meta.dirname, "..");
const catalogue = JSON.parse(
  readFileSync(resolve(root, "catalog/products.public.json"), "utf8"),
);
const products = catalogue.products;

const crawlerAgents = [
  "OAI-SearchBot",
  "GPTBot",
  "Claude-SearchBot",
  "Claude-User",
  "ClaudeBot",
  "PerplexityBot",
  "Perplexity-User",
  "Googlebot",
  "bingbot",
  "Applebot",
];

const declaredRobotsAgents = [
  ...crawlerAgents,
  "Google-Extended",
  "Applebot-Extended",
];

const payloadMarkers = ["```", "## System role", "<system>", "---\nname:"];

async function request(path, options = {}) {
  const response = await fetch(origin + path, { redirect: "follow", ...options });
  const text = await response.text();
  return { response, text };
}

function requireValue(condition, message) {
  if (!condition) throw new Error(message);
}

async function expectStatus(path, status = 200) {
  const result = await request(path);
  requireValue(
    result.response.status === status,
    `${path}: expected ${status}, got ${result.response.status}`,
  );
  return result;
}

const rootPage = await expectStatus("/");
const agentsPage = await expectStatus("/agents");
const catalogueResult = await expectStatus("/catalog.json");
const agentsTxt = await expectStatus("/agents.txt");
const llmsTxt = await expectStatus("/llms.txt");
const robots = await expectStatus("/robots.txt");
const sitemap = await expectStatus("/sitemap.xml");

const remoteCatalogue = JSON.parse(catalogueResult.text);
requireValue(remoteCatalogue.productCount === products.length, "catalogue product count drift");
requireValue(
  agentsPage.text.includes(`href="${origin}/agents"`) ||
    agentsPage.text.includes(`href=\"${origin}/agents\"`),
  "agents page canonical origin mismatch",
);

for (const agent of declaredRobotsAgents) {
  requireValue(robots.text.includes(`User-agent: ${agent}`), `robots missing ${agent}`);
}
requireValue(robots.text.includes("User-agent: *"), "robots missing wildcard agent");
requireValue(robots.text.includes("Allow: /"), "robots does not broadly allow crawling");
requireValue(
  robots.text.includes(`Sitemap: ${origin}/sitemap.xml`),
  "robots sitemap origin mismatch",
);

for (const crawler of crawlerAgents) {
  for (const path of ["/agents", "/catalog.json"]) {
    const { response } = await request(path, { headers: { "user-agent": crawler } });
    requireValue(response.status === 200, `${crawler} blocked on ${path}: ${response.status}`);
  }
}

for (const product of products) {
  const page = await expectStatus(`/products/${product.slug}`);
  requireValue(page.text.includes(product.name), `${product.slug}: detail page missing name`);
  requireValue(
    page.text.includes(`${origin}/products/${product.slug}`),
    `${product.slug}: canonical/structured URL mismatch`,
  );

  const raw = await expectStatus(`/raw/products/${product.slug}.md`);
  requireValue(raw.text.includes(product.name), `${product.slug}: raw metadata missing name`);
  requireValue(raw.text.includes(`- type: ${product.productType}`), `${product.slug}: raw type mismatch`);
  for (const marker of payloadMarkers) {
    requireValue(!raw.text.includes(marker), `${product.slug}: raw payload marker leaked`);
  }

  requireValue(
    sitemap.text.includes(`${origin}/products/${product.slug}`),
    `${product.slug}: missing from sitemap`,
  );
}

for (const surface of [catalogueResult.text, agentsTxt.text, llmsTxt.text, rootPage.text]) {
  for (const marker of payloadMarkers) {
    requireValue(!surface.includes(marker), `payload marker leaked on public surface: ${marker}`);
  }
}

for (const retired of [
  "/products/audiogram",
  "/raw/products/audiogram.md",
  "/products/audiogram-generator",
]) {
  await expectStatus(retired, 404);
}

console.log(
  JSON.stringify({
    status: "PASS",
    origin,
    products: products.length,
    crawlerAgentsChecked: crawlerAgents.length,
    machineSurfaces: ["/catalog.json", "/agents.txt", "/llms.txt", "/robots.txt", "/sitemap.xml"],
  }),
);
