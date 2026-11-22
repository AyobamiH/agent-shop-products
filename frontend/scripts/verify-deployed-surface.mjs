import { loadReleaseExpectation, verifyPublicCommerce } from "../../scripts/commerce-release-policy.mjs";
import { readFileSync } from "node:fs";
import { isDeepStrictEqual } from "node:util";
import { resolve } from "node:path";
import { verifyDiscoveryMeasurement } from "./verify-discovery-measurement.mjs";
import { verifyRegistrySurface } from "./verify-registry-surface.mjs";
import { SUPPORT_EMAIL } from "../src/lib/contact.ts";

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

const packageSource = JSON.parse(readFileSync(resolve(root, "catalog/integration-packages.json"), "utf8"));
const packageResult = await expectStatus("/integration-packages.json");
requireValue(isDeepStrictEqual(JSON.parse(packageResult.text), packageSource), "Integration package metadata drift");
const integrationPage = await expectStatus("/integration-services");
for (const item of packageSource.packages) requireValue(integrationPage.text.includes(item.title), "Missing integration package " + item.id);
for (const method of ["POST", "PUT", "PATCH", "DELETE"]) {
  const result = await request("/integration-packages.json", { method });
  requireValue(result.response.status === 405 && result.response.headers.get("allow") === "GET", "Integration packages must reject " + method);
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
const legalPaths = ["kit-terms", "kit-licence", "kit-refunds", "kit-privacy"].map((slug) => "/legal/" + slug);
for (const path of ["/private-kits", ...legalPaths]) {
  const page = await expectStatus(path);
  requireValue(sitemap.text.includes(canonicalOrigin + path), path + ": missing sitemap entry");
  requireValue(page.text.includes(canonicalOrigin + path), path + ": missing canonical URL");
  requireValue(rootPage.text.includes('href="' + path + '"'), path + ": missing footer link");
  if (path.startsWith("/legal/")) {
    const selected = loadReleaseExpectation();
    const expectedPolicyVersion = selected.mode === "live" ? selected.approval.termsVersion : null;
    requireValue(expectedPolicyVersion && page.text.includes(expectedPolicyVersion) &&
      page.text.includes(`href="mailto:${SUPPORT_EMAIL}"`),
      path + ": missing selected policy version or canonical customer contact");
  }
}
for (const [path, page] of [["/", rootPage], ["/private-kits", privateKitPage], ["/private-kits/complete", privateKitComplete],
  ...await Promise.all(legalPaths.map(async (path) => [path, await request(path)]))]) {
  for (const phrase of ["Approved pre-launch", "checkout remains closed", "authenticated order readback",
    "must be verified before sales", "Tax treatment is being verified", "must be completed before launch",
    "invented commerce data", "descriptor — brand not chosen"]) {
    requireValue(!page.text.includes(phrase), path + ": internal workflow text in public page");
  }
}
await expectStatus("/legal/not-a-policy", 404);
const commerce = JSON.parse(commerceResult.text);
requireValue(commerce.schemaVersion === 1 && Array.isArray(commerce.offers),
  "commerce offer projection must have a versioned validated schema");
requireValue(commerce.offers.length === 1 &&
  commerce.offers[0].id === "private-production-agent-operating-kit",
  "private-kit commercial inventory drift");
requireValue(privateKitPage.text.includes("Private Production Agent Operating Kit"),
  "private kit detail route missing original kit description");
requireValue(privateKitComplete.text.includes("Your kit order"),
  "order completion route must render order help instead of its parent catalogue");
requireValue(privateKitComplete.text.includes("noindex"),
  "order completion route must not be indexed");
const commerceAcceptance = verifyPublicCommerce(commerce, loadReleaseExpectation());

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
const discoveryAcceptance = await verifyDiscoveryMeasurement(origin, canonicalOrigin);
console.log(
  JSON.stringify({
    status: "PASS",
    origin,
    canonicalOrigin,
    products: products.length,
    ...commerceAcceptance,
    ...registryAcceptance,
    ...discoveryAcceptance,
    crawlerAgentsChecked: crawlerAgents.length,
    machineSurfaces: ["/catalog.json", "/agents.txt", "/llms.txt", "/robots.txt", "/sitemap.xml"],
  }),
);