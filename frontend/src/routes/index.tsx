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

const TITLE = `${SITE_DESCRIPTOR} for Autonomous Agents`;

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
  const products = listProducts();
  const featured = getFeaturedProducts();
  const categories = listCategories();
  const promptCount = products.filter((product) => product.productType === "prompt").length;
  const skillCount = products.filter((product) => product.productType === "skill").length;

  return (
    <PageShell>
      <section className="grid gap-10 border-b border-border pb-14 lg:grid-cols-[1.15fr_0.85fr] lg:items-start lg:gap-14">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
            <span className="inline-block size-2 bg-primary" aria-hidden="true" />
            public agent registry
          </div>
          <h1 className="mt-5 max-w-3xl text-balance text-4xl font-semibold leading-[1.08] tracking-[-0.035em] sm:text-5xl">
            {PRODUCT_HEADLINE}
          </h1>
          <p className="mt-5 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground">
            {PRODUCT_SUPPORTING}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/agents"
              className="rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
            >
              Read agent discovery guide
            </Link>
            <Link
              to="/shop"
              className="rounded-md border border-border bg-surface px-4 py-2.5 text-sm font-medium transition-colors hover:border-primary/40"
            >
              Search capability catalogue
            </Link>
          </div>
        </div>

        <aside className="rounded-lg border border-border bg-surface p-5" aria-label="Registry snapshot">
          <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">registry snapshot</p>
              <p className="mt-1 text-sm font-medium">Canonical public projection</p>
            </div>
            <img src="/agent-registry-mark.svg" alt="Agent Capability Catalogue registry aperture logo" className="size-9" />
          </div>
          <dl className="divide-y divide-border">
            <RegistryRow label="records" value={String(catalogMeta.productCount)} />
            <RegistryRow label="types" value={`${promptCount} prompt · ${skillCount} skill`} />
            <RegistryRow label="schema" value={catalogMeta.schemaVersion} />
            <RegistryRow label="catalogue" value="GET /catalog.json" strong />
            <RegistryRow label="payloads" value="metadata public · bodies withheld" />
            <RegistryRow label="source" value={catalogMeta.upstreamRepository} />
          </dl>
        </aside>
      </section>

      <section className="mt-16">
        <SectionHeading
          eyebrow="Capabilities"
          title="Inspect source-backed records"
          description="Each capability publishes the problem, outcomes, requirements and boundaries an agent needs before choosing it."
        />
        <ProductList className="mt-6" products={featured} />
      </section>

      <section className="mt-16 border-t border-border pt-14">
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
                className="inline-block rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                {categoryLabel(category)}
              </Link>
            </li>
          ))}
        </ul>
        <Link
          to="/problems"
          className="mt-5 inline-block text-sm font-medium text-primary underline decoration-primary/30 underline-offset-4"
        >
          Browse all problem statements
        </Link>
      </section>

      <section className="mt-16 border-t border-border pt-14">
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

function RegistryRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="grid min-h-11 grid-cols-[6.5rem_1fr] items-center gap-4 py-3 text-sm">
      <dt className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">{label}</dt>
      <dd className={strong ? "font-mono font-medium text-primary" : "font-mono text-xs text-foreground"}>
        {value}
      </dd>
    </div>
  );
}
