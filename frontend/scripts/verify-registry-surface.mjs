import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/** Outside-in readback must compare exact names, not merely an advertised count. */
export async function verifyRegistrySurface(origin) {
  const root = resolve(import.meta.dirname, "..");
  const inventory = JSON.parse(
    readFileSync(resolve(root, "catalog/capability-inventory.json"), "utf8"),
  );
  const localBugs = JSON.parse(
    readFileSync(resolve(root, "catalog/agentic-coding-bugs.json"), "utf8"),
  );
  async function get(path) {
    const response = await fetch(origin + path);
    if (response.status !== 200) throw new Error(`${path}: expected 200, got ${response.status}`);
    return response;
  }
  const registry = await (await get("/capabilities.json")).json();
  const names = (kind) =>
    registry.capabilities
      .filter((c) => c.kind === kind)
      .map((c) => c.name)
      .sort();
  for (const [kind, expected] of [
    ["skill", inventory.skills.map((s) => s.name)],
    ["tool", inventory.tools.map((t) => t.name)],
    ["control", inventory.orchestrationControls],
  ]) {
    if (JSON.stringify(names(kind)) !== JSON.stringify([...expected].sort()))
      throw new Error(`Exact ${kind} registry drift`);
  }
  if (registry.capabilityCount !== 990 || registry.capabilities.length !== 990)
    throw new Error("External count drift");
  const bugs = await (await get("/coding-bugs.json")).json();
  if (bugs.bugCount !== localBugs.bugs.length) throw new Error("Bug index count drift");
  for (const local of localBugs.bugs) {
    const remote = bugs.bugs.find((b) => b.id === local.id);
    if (!remote || remote.status !== local.status || remote.evidence.scope !== local.evidence.scope)
      throw new Error(`Bug evidence drift ${local.id}`);
  }
  for (const kind of ["skill", "tool", "control"]) {
    const record = registry.capabilities.find(
      (c) => c.kind === kind && c.integrationRequestAllowed,
    );
    const html = await (await get(`/capabilities/${record.id}`)).text();
    if (!html.includes("Original integration work"))
      throw new Error(`Missing integration route ${record.id}`);
    const brief = await (await get(`/capability-brief.json?id=${record.id}`)).json();
    if (brief.capability.id !== record.id || brief.handoff.templateIsIncomplete !== true)
      throw new Error(`Invalid brief ${record.id}`);
  }
  for (const path of ["/capabilities", "/coding-bugs"]) await get(path);
  return { externalCapabilities: 990, codingBugs: bugs.bugCount };
}
