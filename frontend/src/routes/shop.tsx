import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/PageShell";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { catalogMeta, listProducts } from "@/domain/catalog/repository";
import { CatalogBrowser } from "@/features/catalog-browse/components/CatalogBrowser";
import { validateCatalogSearch } from "@/features/catalog-search/lib/search-params";
import { buildItemListJsonLd } from "@/lib/jsonld/product";
import { buildCollectionPageJsonLd } from "@/lib/jsonld/site";
import { buildPageHead } from "@/lib/seo/meta";
import { SITE_DESCRIPTOR } from "@/lib/site";
import { RegistryLinks } from "@/features/capabilities/RegistryLinks";

const TITLE = `Capability catalogue — ${SITE_DESCRIPTOR}`;
const DESCRIPTION =
  "Deterministic capability discovery for agents. Search source-backed prompts and skills by problem, category and tag.";

export const Route = createFileRoute("/shop")({
  validateSearch: validateCatalogSearch,
  head: () =>
    buildPageHead({
      title: TITLE,
      description: DESCRIPTION,
      path: "/shop",
      jsonLd: [
        buildCollectionPageJsonLd({
          path: "/shop",
          name: "Capability catalogue",
          description: DESCRIPTION,
        }),
        buildItemListJsonLd(listProducts(), "Agent capability catalogue"),
      ],
    }),
  component: ShopPage,
});

function ShopPage() {
  const products = listProducts();

  return (
    <PageShell>
      <SectionHeading
        as="h1"
        eyebrow={`${catalogMeta.productCount} original product records`}
        title="Capability catalogue"
        description={DESCRIPTION}
      />
      <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
        Inspect original workflows, explore every advertised external skill, tool and control, and
        prepare an integration request for provider review.
      </p>
      <RegistryLinks />
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        Public records are inspectable but are not paid licences or installed tools. For reviewed
        implementation work and quote-first commercial terms,{" "}
        <a href="/integration-services" className="text-primary underline underline-offset-4">
          see professional integration
        </a>
        .
      </p>
      <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
        Not sure which capability to inspect?{" "}
        <Link to="/solutions" className="font-medium text-primary underline underline-offset-4">
          Start with the problem and a practical verification checklist
        </Link>
        .
      </p>
      <div className="mt-10">
        <CatalogBrowser products={products} />
      </div>
    </PageShell>
  );
}
