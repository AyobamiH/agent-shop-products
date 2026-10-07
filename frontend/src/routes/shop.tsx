import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/PageShell";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { catalogMeta, listProducts } from "@/domain/catalog/repository";
import { CatalogBrowser } from "@/features/catalog-browse/components/CatalogBrowser";
import { validateCatalogSearch } from "@/features/catalog-search/lib/search-params";
import { buildMeta } from "@/lib/seo/meta";
import { SITE_DESCRIPTOR } from "@/lib/site";

const TITLE = `Shop — ${SITE_DESCRIPTOR}`;
const DESCRIPTION =
  "Search and filter the full catalogue of prompts, skills and production packs by problem, category and tag.";

export const Route = createFileRoute("/shop")({
  validateSearch: validateCatalogSearch,
  head: () => ({ meta: buildMeta({ title: TITLE, description: DESCRIPTION }) }),
  component: ShopPage,
});

function ShopPage() {
  const products = listProducts();

  return (
    <PageShell>
      <SectionHeading
        as="h1"
        eyebrow={`${catalogMeta.productCount} products`}
        title="Catalogue"
        description={DESCRIPTION}
      />
      <div className="mt-10">
        <CatalogBrowser products={products} />
      </div>
    </PageShell>
  );
}