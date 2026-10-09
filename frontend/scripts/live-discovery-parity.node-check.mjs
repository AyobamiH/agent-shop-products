import test from "node:test";
import assert from "node:assert/strict";
import { assessLiveParity } from "./live-discovery-parity.mjs";

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
