import {
  acquisitionPolicy,
  capabilityMeta,
  listCapabilities,
} from "@/domain/capabilities/repository";
import { queryCapabilities, validateCapabilityQuery } from "@/domain/capabilities/search";
import { absoluteUrl } from "@/lib/site";
import type { Capability } from "@/domain/capabilities/types";

function publicRecord(record: Capability) {
  return {
    ...record,
    detailUrl: absoluteUrl(`/capabilities/${record.id}`),
    briefUrl: absoluteUrl(`/capability-brief.json?id=${encodeURIComponent(record.id)}`),
  };
}
export function buildCapabilitiesJson(params?: URLSearchParams) {
  const query = validateCapabilityQuery(Object.fromEntries(params ?? []));
  const filtered = Boolean(query.q || query.kind || query.provider || params?.has("page"));
  const result = queryCapabilities(listCapabilities(), query);
  return {
    schemaVersion: capabilityMeta.schemaVersion,
    recordKind: "external-capability-acquisition-catalogue",
    capturedOn: capabilityMeta.capturedOn,
    capabilityCount: capabilityMeta.count,
    counts: capabilityMeta.counts,
    scope: capabilityMeta.scope,
    acquisition: acquisitionPolicy,
    query: filtered ? { ...query, page: result.page } : {},
    matchedCount: filtered ? result.total : capabilityMeta.count,
    ...(filtered ? { page: result.page, pageCount: result.pageCount } : {}),
    capabilities: (filtered ? result.records : listCapabilities()).map(publicRecord),
  };
}
