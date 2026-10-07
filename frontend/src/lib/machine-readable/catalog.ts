/**
 * /catalog.json projection. Derived from the same repository the UI uses, so
 * human and machine surfaces can never disagree (DEC-002).
 */

import { catalogMeta, listProducts } from "@/domain/catalog/repository";
import { catalogSource } from "@/domain/catalog/source";

export function buildCatalogJson(): Record<string, unknown> {
  return {
    schemaVersion: catalogMeta.schemaVersion,
    catalogKind: catalogMeta.catalogKind,
    productCount: catalogMeta.productCount,
    source: {
      repository: catalogSource.upstream.repository,
      branch: catalogSource.upstream.branch,
      publicProjectionPath: catalogSource.upstream.publicProjectionPath,
      metadataAuthorityPath: catalogSource.upstream.metadataAuthorityPath,
      provenanceManifestPath: catalogSource.upstream.provenanceManifestPath,
      localRole: catalogSource.localRole,
      syncedOn: catalogSource.syncedOn,
    },
    policy: {
      noMockProducts: true,
      noInventedPrice: true,
      noInventedReviews: true,
      noInventedCompatibility: true,
      noInventedEvidenceLevel: true,
      fullPromptBodiesWithheld: true,
    },
    agentInterface: { kind: "cli", status: "planned" },
    products: listProducts().map((product) => ({
      ...product,
      detailUrl: `/products/${product.slug}`,
      rawUrl: `/raw/products/${product.slug}.md`,
    })),
  };
}