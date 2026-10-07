import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/PageShell";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { getFeaturedProducts } from "@/domain/catalog/featured";
import { catalogMeta, listCategories, listProducts } from "@/domain/catalog/repository";
import { categoryLabel } from "@/domain/catalog/facets";
import { ProductList } from "@/features/catalog-browse/components/ProductList";
import { MachineSurfaces } from "@/features/agent-discovery/components/MachineSurfaces";
import { buildItemListJsonLd } from "@/lib/jsonld/product";
import { buildCollectionPageJsonLd, buildWebSiteJsonLd } from "@/lib/jsonld/site";
import { buildPageHead } from "@/lib/seo/meta";
import { PRODUCT_HEADLINE, PRODUCT_SUPPORTING, SITE_DESCRIPTOR } from "@/lib/site";

const TITLE = `${SITE_DESCRIPTOR} — capabilities for autonomous agents`;

export const Route = createFileRoute("/")({
  head: () =>
    buildPageHead({
      title: TITLE,
      description: PRODUCT_HEADLINE,
      path: "/",
      jsonLd: [
        buildWebSiteJsonLd(),
        buildCollectionPageJsonLd({
          path: "/",
          name: SITE_DESCRIPTOR,
          description: PRODUCT_HEADLINE,
        }),
        buildItemListJsonLd(listProducts(), "Source-backed agent capabilities"),
      ],
    }),
  component: HomePage,
});

function HomePage() {
  const featured = getFeaturedProducts();
  const categories = listCategories();

  return (
    <PageShell>
      <section>
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          {catalogMeta.productCount} machine-discoverable capabilities
        </p>
        <h1 className="mt-4 max-w-3xl text-balance text-4xl font-semibold leading-tight sm:text-5xl">
          {PRODUCT_HEADLINE}
        </h1>
        <p className="mt-5 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground">
          {PRODUCT_SUPPORTING}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/agents"
            className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
          >
            Read agent discovery guide
          </Link>
          <Link
            to="/shop"
            className="rounded-md border border-border px-4 py-2 text-sm font-medium"
          >
            Search capability catalogue
          </Link>
        </div>
      </section>

      <section className="mt-16">
        <SectionHeading
          eyebrow="Capabilities"
          title="Inspect source-backed records"
          description="Each capability publishes the problem, outcomes, requirements and boundaries an agent needs before choosing it."
        />
        <ProductList className="mt-6" products={featured} />
      </section>

      <section className="mt-16">
        <SectionHeading
          eyebrow="Problem routing"
          title="Discover by failure mode or category"
          description="Category and problem signals come directly from the canonical catalogue."
        />
        <ul className="mt-6 flex list-none flex-wrap gap-2">
          {categories.map((category) => (
            <li key={category}>
              <Link
                to="/shop"
                search={{ category }}
                className="inline-block rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                {categoryLabel(category)}
              </Link>
            </li>
          ))}
        </ul>
        <Link
          to="/problems"
          className="mt-5 inline-block text-sm font-medium underline underline-offset-4"
        >
          Browse all problem statements
        </Link>
      </section>

      <section className="mt-16">
        <SectionHeading
          eyebrow="Machine discovery"
          title="Read the catalogue without scraping UI"
          description="JSON, text and Markdown projections derive from the same canonical records as the HTML routes."
        />
        <div className="mt-6">
          <MachineSurfaces exampleSlug={featured[0]?.slug} />
        </div>
      </section>
    </PageShell>
  );
}
