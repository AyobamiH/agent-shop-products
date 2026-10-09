import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const ORIGIN = "https://agents.proofandstate.com";
const DETAIL_FIELDS = [
  "id", "slug", "name", "productType", "category", "summary",
  "problem", "coreOutcomes", "requirements", "boundaries", "tags",
];

export function assessLiveParity(source, live, sitemap, solutionsHtml, agentsTxt) {
  const problems = [];

  if (!Array.isArray(source?.products) || !Array.isArray(live?.products)) {
    return ["Canonical or public catalogue products array is unavailable"];
  }

  if (live.productCount !== source.products.length) {
    problems.push(
      "Source/live count drift: main has " + source.products.length +
      " records; deployed catalogue reports " + live.productCount,
    );
  }

  const actualById = new Map(live.products.map((product) => [product.id, product]));
  const expectedIds = new Set(source.products.map((product) => product.id));

  if (expectedIds.size !== source.products.length) {
    problems.push("Source catalogue contains duplicate product IDs");
  }

  for (const product of source.products) {
    const liveProduct = actualById.get(product.id);
    if (!liveProduct) {
      problems.push("Source product missing from public Worker: " + product.id);
      continue;
    }

    for (const field of DETAIL_FIELDS) {
      if (JSON.stringify(product[field]) !== JSON.stringify(liveProduct[field])) {
        problems.push("Product source/live metadata drift: " + product.id + "." + field);
      }
    }

    if (!sitemap.includes("<loc>" + ORIGIN + "/products/" + product.slug + "</loc>")) {
      problems.push("Canonical sitemap missing product: " + product.slug);
    }
  }

  for (const product of live.products) {
    if (!expectedIds.has(product.id)) {
      problems.push("Unexpected deployed product: " + product.id);
    }
    for (const key of ["price", "currency", "offers", "checkoutUrl", "stripePriceId"]) {
      if (Object.hasOwn(product, key)) {
        problems.push("Unapproved commerce field in public product: " + product.id + "." + key);
      }
    }
  }

  if (!sitemap.includes("<loc>" + ORIGIN + "/solutions</loc>")) {
    problems.push("New public problem-solving page is missing from sitemap");
  }
  for (const id of [
    "verify-agent-work",
    "install-agent-integration",
    "recover-autonomous-work",
    "subcontract-agent-task",
  ]) {
    if (!solutionsHtml.includes('id="' + id + '"')) {
      problems.push("Public solution guide missing an independently useful problem: " + id);
    }
  }

  if (!agentsTxt.includes("problem-led decision guides: " + ORIGIN + "/solutions")) {
    problems.push("Machine discovery does not advertise the problem-solving route");
  }

  return problems;
}

async function getText(path) {
  const url = ORIGIN + path;
  const response = await fetch(url, {
    redirect: "error",
    headers: { Accept: "text/html,application/json,text/plain", "Cache-Control": "no-cache" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    throw new Error("Outside-in GET " + path + " returned HTTP " + response.status);
  }
  return response.text();
}

async function main() {
  const source = JSON.parse(
    await readFile(new URL("../../catalog/products.public.json", import.meta.url), "utf8"),
  );
  const [catalogText, sitemap, guide, agents] = await Promise.all([
    getText("/catalog.json"),
    getText("/sitemap.xml"),
    getText("/solutions"),
    getText("/agents.txt"),
  ]);
  const live = JSON.parse(catalogText);
  const issues = assessLiveParity(source, live, sitemap, guide, agents);
  console.log(JSON.stringify({
    status: issues.length ? "DRIFT" : "ALIGNED",
    observedAt: new Date().toISOString(),
    gitRevision: process.env.GITHUB_SHA ?? "not_supplied",
    sourceProducts: source.products.length,
    liveProducts: live.productCount,
    verifiedDomain: ORIGIN,
    issueCount: issues.length,
    issues: issues.slice(0, 60),
  }, null, 2));
  if (issues.length) process.exitCode = 1;
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  main().catch((error) => {
    console.error(JSON.stringify({
      status: "UNAVAILABLE",
      gitRevision: process.env.GITHUB_SHA ?? "not_supplied",
      message: error instanceof Error ? error.message : String(error),
    }));
    process.exitCode = 1;
  });
}
