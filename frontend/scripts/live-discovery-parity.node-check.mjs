import test from "node:test";
import assert from "node:assert/strict";
import { assessCommerceParity, assessLiveParity } from "./live-discovery-parity.mjs";

const product = {
  id: "source-backed-example",
  slug: "source-backed-example",
  name: "Source-Backed Example",
  productType: "skill",
  category: "verification",
  summary: "Inspect verifiable public outcomes.",
  problem: "A reported action does not provide evidence of completion.",
  coreOutcomes: ["Bounded readback"],
  requirements: ["Authorised public evidence"],
  boundaries: ["No mutation authority"],
  tags: ["verification"],
};
const sitemap =
  "<loc>https://agents.proofandstate.com/products/source-backed-example</loc>" +
  "<loc>https://agents.proofandstate.com/solutions</loc>";
const solutionsHtml = [
  "verify-agent-work",
  "install-agent-integration",
  "recover-autonomous-work",
  "subcontract-agent-task",
].map((id) => '<section id="' + id + '"></section>').join("");
const agentsTxt =
  "problem-led decision guides: https://agents.proofandstate.com/solutions";

test("current exact product and discoverability graph is aligned", () => {
  const issues = assessLiveParity(
    { products: [product] },
    { productCount: 1, products: [{ ...product, detailUrl: "/products/source-backed-example" }] },
    sitemap,
    solutionsHtml,
    agentsTxt,
  );
  assert.deepEqual(issues, []);
});

test("detects unpublished source records and missing indexing links", () => {
  const issues = assessLiveParity(
    { products: [product] },
    { productCount: 0, products: [] },
    "<urlset></urlset>",
    "<main></main>",
    "",
  );
  assert.ok(issues.some((issue) => issue.includes("Source/live count drift")));
  assert.ok(issues.some((issue) => issue.includes("missing from public Worker")));
  assert.ok(issues.some((issue) => issue.includes("problem-solving page is missing")));
  assert.ok(issues.some((issue) => issue.includes("Machine discovery")));
});

test("detects silent copied-content drift and premature paid offer leakage", () => {
  const issues = assessLiveParity(
    { products: [product] },
    {
      productCount: 1,
      products: [{ ...product, summary: "Different claim", price: 49, currency: "GBP" }],
    },
    sitemap,
    solutionsHtml,
    agentsTxt,
  );
  assert.ok(issues.some((issue) => issue.includes("summary")));
  assert.ok(issues.some((issue) => issue.includes("Unapproved commerce field")));
});

test("rejects incomplete live discovery, not an invented empty catalogue", () => {
  assert.deepEqual(
    assessLiveParity({ products: [product] }, {}, sitemap, solutionsHtml, agentsTxt),
    ["Canonical or public catalogue products array is unavailable"],
  );
});

const sourceKit = {
  schemaVersion: 1,
  offers: [{
    id: "private-production-agent-operating-kit",
    productId: "production-agent-operating-files",
    title: "Private Production Agent Operating Kit", summary: "Original private reference kit",
    version: "2026.10.1", currency: "gbp", introductoryUnitAmountPence: 900,
    buyerRequirements: ["explicit operator authority"],
  }],
};
const plannedKit = { schemaVersion: 1, commerceActive: false,
  offers: [{ ...sourceKit.offers[0], availability: "planned" }] };
const kitHtml = '<h1>Private Production Agent Operating Kit</h1>';
const completeHtml = '<meta name="robots" content="noindex, follow">';

test("read-only commercial parity reports aligned planned offer without declaring revenue", () => {
  assert.deepEqual(assessCommerceParity(sourceKit, plannedKit, kitHtml, completeHtml), []);
});

test("detects a priced kit silently published without commerce approval", () => {
  const issues = assessCommerceParity(sourceKit, {
    ...plannedKit, offers: [{ ...plannedKit.offers[0], unitAmountPence: 4900 }],
  }, kitHtml, completeHtml);
  assert.ok(issues.some((issue) => issue.includes("Unapproved private-kit price")));
});

test("detects missing legal refs on an active offer and never claims a purchase", () => {
  const issues = assessCommerceParity(sourceKit, {
    ...plannedKit, commerceActive: true,
    offers: [{ ...plannedKit.offers[0], availability: "purchase_available", unitAmountPence: 4900 }],
  }, kitHtml, completeHtml);
  assert.ok(issues.some((issue) => issue.includes("Active private-kit offer lacks")));
});

test("detects an active Stripe price above approved £9 entry level", () => {
  const live = { ...plannedKit, commerceActive: true,
    offers: [{ ...plannedKit.offers[0], availability: "purchase_available",
      unitAmountPence: 4900, termsUrl: "https://agents.proofandstate.com/legal/kit-terms",
      licenceUrl: "https://agents.proofandstate.com/legal/kit-licence",
      refundUrl: "https://agents.proofandstate.com/legal/kit-refunds" }] };
  const issues = assessCommerceParity(sourceKit, live, kitHtml, completeHtml);
  assert.ok(issues.some((message) => message.includes("Active private-kit offer lacks")));
});

test("requires an unindexed buyer-completion page and no private asset keys in public offers", () => {
  const issues = assessCommerceParity(sourceKit, {
    ...plannedKit, offers: [{ ...plannedKit.offers[0], assetKey: "private/R2/file.zip" }],
  }, kitHtml, '<meta name="robots" content="index, follow">');
  assert.ok(issues.some((issue) => issue.includes("Sensitive or unapproved")));
  assert.ok(issues.some((issue) => issue.includes("noindex")));
});
