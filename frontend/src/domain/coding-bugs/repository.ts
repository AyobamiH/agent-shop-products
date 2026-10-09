import { z } from "zod";
import json from "@catalog/agentic-coding-bugs.json";
import { getProductById } from "@/domain/catalog/repository";

const text = z.string().min(1);
const bugSchema = z
  .object({
    id: z.string().regex(/^BUG-\d{4}$/),
    title: text,
    project: text,
    category: text,
    trigger: text,
    symptom: text,
    rootCause: text,
    consequence: text,
    repair: text,
    regressionCheck: text,
    status: z.enum([
      "Historical repair reported",
      "Preventive failure mode",
      "Implementation reviewed",
      "Candidate fix open",
      "Cause unresolved",
    ]),
    evidence: z
      .object({
        id: z.string().regex(/^BEV-\d{4}$/),
        sourceId: text,
        basis: text,
        sourceUrl: z.string().url(),
        scope: text,
      })
      .strict(),
    skillId: text,
    nextAcceptance: text,
    indexedOn: text,
  })
  .strict();
const index = z
  .object({
    schemaVersion: text,
    recordKind: text,
    indexedOn: text,
    scope: text,
    bugs: z.array(bugSchema),
  })
  .strict()
  .parse(json);
const ids = new Set<string>();
const evidenceIds = new Set<string>();
for (const bug of index.bugs) {
  if (ids.has(bug.id) || evidenceIds.has(bug.evidence.id))
    throw new Error("Duplicate bug/evidence ID");
  if (!getProductById(bug.skillId)) throw new Error(`Unknown bug repair skill: ${bug.skillId}`);
  ids.add(bug.id);
  evidenceIds.add(bug.evidence.id);
}
export type CodingBug = z.infer<typeof bugSchema>;
export const codingBugIndex = index;
export function listCodingBugs(): readonly CodingBug[] {
  return index.bugs;
}
