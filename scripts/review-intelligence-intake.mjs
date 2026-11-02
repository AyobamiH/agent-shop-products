import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const SOURCE_TYPES = new Set([
  "problem", "reusable-solution", "execution-solution",
  "research-candidate", "project-solution",
]);

export function normaliseTitle(value) {
  return String(value ?? "").normalize("NFKD").toLowerCase()
    .replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim()
    .replace(/\s+/g, " ");
}

function proposed(label) {
  return /\b(proposed|candidate|unverified|unproven|not implemented|not deployed|no live|await|blocked|open|only)\b/i.test(label);
}

export function reviewIntake(snapshot, catalogue) {
  if (snapshot?.recordKind !== "private-candidate-inventory" ||
      !Array.isArray(snapshot.sources) || !Array.isArray(catalogue?.products)) {
    throw Error("INVALID_INTAKE_OR_CATALOGUE");
  }
  const existing = new Map();
  for (const product of catalogue.products) {
    const title = normaliseTitle(product.name);
    if (!title || existing.has(title)) throw Error("INVALID_CANONICAL_TITLES");
    existing.set(title, product.id);
  }
  const seenIds = new Set();
  const byTitle = new Map();
  const reviews = [];
  const counts = {
    total: 0, sourceSlices: snapshot.sources.length,
    problemOnly: 0, researchOnly: 0, reviewNeeded: 0,
    exactTitleMatches: 0, limitedEvidence: 0, duplicateTitles: 0,
  };
  for (const slice of snapshot.sources) {
    const type = slice?.source?.type;
    if (!SOURCE_TYPES.has(type) || !Array.isArray(slice.records) ||
        typeof slice.source.spreadsheetId !== "string" ||
        typeof slice.source.tab !== "string") throw Error("INVALID_SOURCE_SLICE");
    for (const record of slice.records) {
      const key = [slice.source.spreadsheetId, slice.source.tab, record?.id].join(":");
      const title = normaliseTitle(record?.title);
      if (seenIds.has(key) || !record?.id || !title ||
          !Number.isInteger(record.row) || record.row < 2) throw Error("INVALID_OR_DUPLICATE_RECORD");
      seenIds.add(key);
      const sameTitle = byTitle.get(title) || null;
      if (!sameTitle) byTitle.set(title, key);
      let treatment = "review";
      if (type === "problem") treatment = "problem-only";
      else if (type === "research-candidate") treatment = "research-only";
      else if (existing.has(title)) treatment = "already-catalogued-title";
      if (treatment === "problem-only") counts.problemOnly++;
      else if (treatment === "research-only") counts.researchOnly++;
      else if (treatment === "already-catalogued-title") counts.exactTitleMatches++;
      else counts.reviewNeeded++;
      if (proposed((record.verification ?? "") + " " + (record.limitations ?? ""))) {
        counts.limitedEvidence++;
      }
      if (sameTitle) counts.duplicateTitles++;
      counts.total++;
      reviews.push({
        key, title: record.title, sourceType: type, sourceRow: record.row,
        treatment, existingProductId: existing.get(title) || null,
        duplicateOf: sameTitle,
        evidenceNeedsReview: proposed((record.verification ?? "") + " " + (record.limitations ?? "")),
      });
    }
  }
  if (Object.values(counts).some(n => !Number.isInteger(n) || n < 0)) throw Error("INVALID_COUNTS");
  if (counts.problemOnly + counts.researchOnly + counts.reviewNeeded +
      counts.exactTitleMatches !== counts.total) throw Error("TREATMENT_PARTITION_DRIFT");
  return { status:"REVIEW_ONLY", counts, reviews,
    boundary:"Matches are exact-title matches only; semantic duplication still needs human review. No source record is an automatically approved, installed, commercial or indexed product." };
}

export function main(args) {
  if (args.length !== 2 && args.length !== 4) throw Error(
    "Usage: node scripts/review-intelligence-intake.mjs PRIVATE_INPUT.json catalog/products.public.json [--out PRIVATE_REPORT.json]");
  if (args.length === 4 && args[2] !== "--out") throw Error("INVALID_OUTPUT_OPTION");
  const input = JSON.parse(readFileSync(args[0], "utf8"));
  const catalogue = JSON.parse(readFileSync(args[1], "utf8"));
  const result = reviewIntake(input, catalogue);
  if (args[3]) {
    writeFileSync(args[3], JSON.stringify(result, null, 2) + "\n",
      {mode:0o600,flag:"wx"});
  }
  console.log(JSON.stringify({status:result.status,counts:result.counts,report:args[3] ?? "not_saved"}));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { main(process.argv.slice(2)); }
  catch (error) { console.error(String(error.message ?? error)); process.exitCode = 1; }
}
