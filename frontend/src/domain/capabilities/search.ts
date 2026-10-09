import {
  CAPABILITY_KINDS,
  type CapabilityKind,
  type CapabilityQuery,
  type Capability,
} from "./types";

export const CAPABILITY_PAGE_SIZE = 40;
export function validateCapabilityQuery(raw: Record<string, unknown>): CapabilityQuery {
  const page = Number(raw["page"]);
  const q = typeof raw["q"] === "string" ? raw["q"].trim().slice(0, 200) : "";
  const kind = CAPABILITY_KINDS.includes(raw["kind"] as CapabilityKind)
    ? (raw["kind"] as CapabilityKind)
    : undefined;
  const provider = typeof raw["provider"] === "string" ? raw["provider"].trim().slice(0, 150) : "";
  return {
    q: q || undefined,
    kind,
    provider: provider || undefined,
    page: Number.isSafeInteger(page) && page > 1 ? page : undefined,
  };
}

export function queryCapabilities(records: readonly Capability[], query: CapabilityQuery) {
  const tokens = (query.q ?? "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  const matches = records.filter((r) => {
    if (query.kind && r.kind !== query.kind) return false;
    if (query.provider && r.provider !== query.provider) return false;
    const text = `${r.name} ${r.provider} ${r.kind} ${r.surfaces.join(" ")}`.toLowerCase();
    return tokens.every((token) => text.includes(token));
  });
  const pageCount = Math.max(1, Math.ceil(matches.length / CAPABILITY_PAGE_SIZE));
  const page = Math.min(Math.max(1, query.page ?? 1), pageCount);
  return {
    total: matches.length,
    page,
    pageCount,
    records: matches.slice((page - 1) * CAPABILITY_PAGE_SIZE, page * CAPABILITY_PAGE_SIZE),
  };
}
