import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { verifyRegistrySurface } from "./verify-registry-surface.mjs";

const origin = (process.env.ACCEPTANCE_ORIGIN ?? "").replace(/\/+$/, "");
if (!origin) throw new Error("ACCEPTANCE_ORIGIN is required");
// Version URL requests target ACCEPTANCE_ORIGIN, metadata must be canonical.
const canonicalOrigin = (process.env.CANONICAL_ORIGIN ?? origin).replace(/\/+$/, "");

const root = resolve(import.meta.dirname, "..");
const catalogue = JSON.parse(readFileSync(resolve(root, "catalog/products.public.json"), "utf8"));
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

const declaredRobotsAgents = [...crawlerAgents, "Google-Extended", "Applebot-Extended"];

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

const commerceResult = await expectStatus("/api/v1/commerce/offers");
const privateKitPage = await expectStatus("/private-kits");
const privateKitComplete = await expectStatus("/private-kits/complete");
const commerce = JSON.parse(commerceResult.text);
requireValue(commerce.schemaVersion === 1 && Array.isArray(commerce.offers),
  "commerce offer projection must have a versioned validated schema");
requireValue(commerce.offers.length === 1 &&
  commerce.offers[0].id === "private-production-agent-operating-kit",
  "private-kit commercial inventory drift");
requireValue(privateKitPage.text.includes("Private Production Agent Operating Kit"),
  "private kit detail route missing original kit description");
requireValue(privateKitComplete.text.includes("noindex"),
  "order completion route must not be indexed");
if (commerce.commerceActive === false) {
  requireValue(commerce.offers[0].availability === "planned" &&
    commerce.offers[0].unitAmountPence === undefined &&
    commerce.offers[0].priceId === undefined,
  "disabled private kit must not expose a price or checkout");
} else {
  requireValue(commerce.commerceActive === true &&
    commerce.offers[0].availability === "purchase_available" &&
    Number.isSafeInteger(commerce.offers[0].unitAmountPence) &&
    ["termsUrl", "licenceUrl", "refundUrl"].every((key) =>
      typeof commerce.offers[0][key] === "string"),
  "enabled kit must have approved amount and published terms");
}

const remoteCatalogue = JSON.parse(catalogueResult.text);
requireValue(remoteCatalogue.productCount === products.length, "catalogue product count drift");
requireValue(
  agentsPage.text.includes(`href="${canonicalOrigin}/agents"`) ||
    agentsPage.text.includes(`href=\"${canonicalOrigin}/agents\"`),
  "agents page canonical origin mismatch",
);

for (const agent of declaredRobotsAgents) {
  requireValue(robots.text.includes(`User-agent: ${agent}`), `robots missing ${agent}`);
}
requireValue(robots.text.includes("User-agent: *"), "robots missing wildcard agent");
requireValue(robots.text.includes("Allow: /"), "robots does not broadly allow crawling");
requireValue(
  robots.text.includes(`Sitemap: ${canonicalOrigin}/sitemap.xml`),
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
    page.text.includes(`${canonicalOrigin}/products/${product.slug}`),
    `${product.slug}: canonical/structured URL mismatch`,
  );

  const raw = await expectStatus(`/raw/products/${product.slug}.md`);
  requireValue(raw.text.includes(product.name), `${product.slug}: raw metadata missing name`);
  requireValue(
    raw.text.includes(`- type: ${product.productType}`),
    `${product.slug}: raw type mismatch`,
  );
  for (const marker of payloadMarkers) {
    requireValue(!raw.text.includes(marker), `${product.slug}: raw payload marker leaked`);
  }

  requireValue(
    sitemap.text.includes(`${canonicalOrigin}/products/${product.slug}`),
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

const registryAcceptance = await verifyRegistrySurface(origin);
console.log(
  JSON.stringify({
    status: "PASS",
    origin,
    canonicalOrigin,
    products: products.length,
    privateKitOffer: commerce.offers[0].availability,
    commerceActive: commerce.commerceActive,
    ...registryAcceptance,
    crawlerAgentsChecked: crawlerAgents.length,
    machineSurfaces: ["/catalog.json", "/agents.txt", "/llms.txt", "/robots.txt", "/sitemap.xml"],
  }),
);
