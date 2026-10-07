import { catalogMeta, listProducts } from "@/domain/catalog/repository";
import { catalogSource } from "@/domain/catalog/source";
import { absoluteUrl } from "@/lib/site";

export function buildCatalogJson(): Record<string, unknown> {
  return {
    schemaVersion: catalogMeta.schemaVersion,
    catalogKind: catalogMeta.catalogKind,
    audience: "autonomous-agents",
    productCount: catalogMeta.productCount,
    productCountsByType: catalogSource.productCountsByType,
    discovery: {
      agents: absoluteUrl("/agents"),
      agentsTxt: absoluteUrl("/agents.txt"),
      llmsTxt: absoluteUrl("/llms.txt"),
      sitemap: absoluteUrl("/sitemap.xml"),
    },
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
      fullPromptAndSkillBodiesWithheld: true,
    },
    agentInterface: { kind: "cli", status: "planned", mcp: "out-of-scope" },
    products: listProducts().map((product) => ({
      ...product,
      detailUrl: absoluteUrl(`/products/${product.slug}`),
      rawUrl: absoluteUrl(`/raw/products/${product.slug}.md`),
    })),
  };
}
