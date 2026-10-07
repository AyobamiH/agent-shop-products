/**
 * Catalogue sync boundary.
 *
 * The upstream repository is the authoring authority for every product fact.
 * The bundled catalogue in this project is a synced projection of it, kept
 * static for the frontend phase (no runtime network dependency, no fallback
 * data if a sync is stale).
 *
 * catalog/source.json also carries the explicit expected inventory for the
 * current sync (count, per-type counts and ids). Drift protection compares the
 * projection against that record instead of a hard-coded historical number.
 */

import sourceRecordJson from "@catalog/source.json";

export type CatalogSourceRecord = {
  readonly localRole: string;
  readonly syncedOn: string;
  readonly productCount: number;
  readonly productCountsByType: Readonly<Record<string, number>>;
  readonly productIds: readonly string[];
  readonly upstream: {
    readonly repository: string;
    readonly branch: string;
    readonly publicProjectionPath: string;
    readonly metadataAuthorityPath: string;
    readonly payloadPath: string;
    readonly provenanceManifestPath: string;
  };
};

export const catalogSource = sourceRecordJson as CatalogSourceRecord;

export function upstreamProjectionUrl(): string {
  const { repository, branch, publicProjectionPath } = catalogSource.upstream;
  return `https://github.com/${repository}/blob/${branch}/${publicProjectionPath}`;
}