import inventoryJson from "@catalog/capability-inventory.json";
import acquisitionJson from "@catalog/capability-acquisition.json";
import { acquisitionSchema, inventorySchema } from "./schema";
import type { Capability, CapabilityKind } from "./types";

const inventory = inventorySchema.parse(inventoryJson);
export const acquisitionPolicy = acquisitionSchema.parse(acquisitionJson);

/** Stable across sorting and later additions; collisions fail at the boundary. */
export function capabilityId(kind: CapabilityKind, name: string): string {
  let hash = 2166136261;
  for (let i = 0; i < name.length; i++) hash = Math.imul(hash ^ name.charCodeAt(i), 16777619);
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${kind}-${slug}-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function record(
  kind: CapabilityKind,
  name: string,
  provider: string,
  surfaces: readonly string[],
): Capability {
  const constraint = inventory.executionConstraints.find((entry) => entry.provider === provider);
  return Object.freeze({
    id: capabilityId(kind, name),
    name,
    kind,
    provider,
    surfaces: Object.freeze([...surfaces]),
    ...(constraint ? { executionConstraint: constraint.reason } : {}),
    integrationRequestAllowed: constraint?.state !== "excluded-from-execution",
  });
}

const records: readonly Capability[] = Object.freeze(
  [
    ...inventory.skills.map((s) =>
      record("skill", s.name, s.name.split(":")[0] ?? s.name, s.surfaces),
    ),
    ...inventory.tools.map((t) => record("tool", t.name, t.provider, ["tool-registry"])),
    ...inventory.orchestrationControls.map((name) =>
      record("control", name, name.split(".")[0] ?? "Host", ["host-orchestration"]),
    ),
  ].sort((a, b) => a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name)),
);
const byId = new Map(records.map((entry) => [entry.id, entry]));
if (byId.size !== records.length) throw new Error("Capability ID collision");
for (const [kind, count] of [
  ["skill", inventory.counts.uniqueSkills],
  ["tool", inventory.counts.advertisedTools],
  ["control", inventory.counts.orchestrationControls],
] as const) {
  const names = records.filter((r) => r.kind === kind).map((r) => r.name);
  if (names.length !== count || new Set(names).size !== names.length)
    throw new Error(`Capability ${kind} count/name drift`);
}

export const capabilityMeta = Object.freeze({
  schemaVersion: inventory.schemaVersion,
  capturedOn: inventory.capturedOn,
  count: records.length,
  counts: inventory.counts,
  scope: inventory.scope,
});
export function listCapabilities(): readonly Capability[] {
  return records;
}
export function getCapability(id: string): Capability | undefined {
  return byId.get(id);
}
export const capabilityProviders = Object.freeze(
  [...new Set(records.map((r) => r.provider))].sort(),
);
