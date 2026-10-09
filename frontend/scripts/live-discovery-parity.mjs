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

// Commerce is an independently governed contract, not a field on public skill
// metadata. Read-only parity must detect missing/accidental offer publication
// without claiming that a payment, delivery, installation or customer occurred.
export function assessCommerceParity(source, live, kitHtml, completionHtml) {
  const issues = [];
  if (source?.schemaVersion !== 1 || !Array.isArray(source.offers) ||
      live?.schemaVersion !== 1 || !Array.isArray(live.offers)) {
    return ["Versioned canonical or public commerce projection is unavailable"];
  }
  if (source.offers.length !== live.offers.length) {
    issues.push("Public private-kit offer count differs from canonical source");
  }
  const liveById = new Map(live.offers.map((item) => [item.id, item]));
  for (const offer of source.offers) {
    const deployed = liveById.get(offer.id);
    if (!deployed) { issues.push("Missing public private kit: " + offer.id); continue }
    for (const key of ["id", "productId", "title", "summary", "version", "currency", "buyerRequirements"]) {
      if (JSON.stringify(offer[key]) !== JSON.stringify(deployed[key])) {
        issues.push("Private-kit offer metadata drift: " + offer.id + "." + key);
      }
    }
    for (const prohibited of ["assetKey", "priceId", "checkoutUrl", "claimToken", "stripeSecretKey"]) {
      if (Object.hasOwn(deployed, prohibited)) {
        issues.push("Sensitive or unapproved private-kit field is public: " + prohibited);
      }
    }
    if (!live.commerceActive) {
      if (deployed.availability !== "planned" ||
          deployed.unitAmountPence !== undefined ||
          deployed.termsUrl !== undefined ||
          deployed.licenceUrl !== undefined ||
          deployed.refundUrl !== undefined) {
        issues.push("Unapproved private-kit price or licence published while commerce disabled");
      }
    } else if (deployed.availability !== "purchase_available" ||
          !Number.isSafeInteger(deployed.unitAmountPence) || deployed.unitAmountPence < 100 ||
          !["termsUrl", "licenceUrl", "refundUrl"].every((key) =>
            typeof deployed[key] === "string" &&
            /^https:\/\/(?:agents\.)?proofandstate\.com\/legal\/[a-z0-9-]+$/.test(deployed[key]))) {
      issues.push("Active private-kit offer lacks a verifiable GBP amount or policy reference");
    }
  }
  if (!kitHtml.includes("Private Production Agent Operating Kit")) {
    issues.push("Private-kit public page is missing the original deliverable description");
  }
  if (!completionHtml.includes('name="robots"') || !completionHtml.includes("noindex")) {
    issues.push("Buyer completion page has lost its noindex boundary");
  }
  return issues;
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
  const offerSource = JSON.parse(
    await readFile(new URL("../../commerce/offers.json", import.meta.url), "utf8"),
  );
  const [catalogText, sitemap, guide, agents, commerceText, kitHtml, completionHtml] = await Promise.all([
    getText("/catalog.json"),
    getText("/sitemap.xml"),
    getText("/solutions"),
    getText("/agents.txt"),
    getText("/api/v1/commerce/offers"),
    getText("/private-kits"),
    getText("/private-kits/complete"),
  ]);
  const live = JSON.parse(catalogText);
  const commerce = JSON.parse(commerceText);
  const issues = [
    ...assessLiveParity(source, live, sitemap, guide, agents),
    ...assessCommerceParity(offerSource, commerce, kitHtml, completionHtml),
  ];
  console.log(JSON.stringify({
    status: issues.length ? "DRIFT" : "ALIGNED",
    observedAt: new Date().toISOString(),
    gitRevision: process.env.GITHUB_SHA ?? "not_supplied",
    sourceProducts: source.products.length,
    liveProducts: live.productCount,
    commerceOffer: commerce.offers?.[0]?.availability ?? "unavailable",
    commerceActive: commerce.commerceActive === true,
    paidPurchases: "not_evaluated_in_read_only_discovery_check",
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
