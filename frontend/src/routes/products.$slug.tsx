import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/PageShell";
import { getProductBySlug } from "@/domain/catalog/repository";
import { getRelatedProducts } from "@/domain/catalog/related";
import { DetailList } from "@/features/product-detail/components/DetailList";
import { ProductHeader } from "@/features/product-detail/components/ProductHeader";
import { SourceNotice } from "@/features/product-detail/components/SourceNotice";
import { RelatedProducts } from "@/features/product-detail/components/RelatedProducts";
import { buildProductBreadcrumbJsonLd, buildProductJsonLd } from "@/lib/jsonld/product";
import { buildPageHead, toMetaDescription } from "@/lib/seo/meta";
import { SITE_DESCRIPTOR } from "@/lib/site";
import { SUBCONTRACTING_CAPABILITY_SLUG, SUBCONTRACTING_SERVICE_CATALOGUE, SUBCONTRACTING_SERVICE_GUIDE, SUBCONTRACTING_PROVIDER_NAME } from "@/features/agent-discovery/subcontracting-source";

export const Route = createFileRoute("/products/$slug")({
  loader: ({ params }) => {
    const product = getProductBySlug(params.slug);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: `Capability unavailable — ${SITE_DESCRIPTOR}` },
          { name: "robots", content: "noindex, nofollow" },
        ],
      };
    }
    const { product } = loaderData;
    const title = product.name.length < 30 ? `${product.name} — Agent Capability` : product.name;
    return buildPageHead({
      title,
      description: toMetaDescription(product.summary),
      path: `/products/${product.slug}`,
      jsonLd: [buildProductJsonLd(product), buildProductBreadcrumbJsonLd(product)],
      links: [
        {
          rel: "alternate",
          href: `/raw/products/${product.slug}.md`,
          type: "text/markdown",
          title: `${product.name} metadata`,
        },
      ],
    });
  },
  component: ProductDetailPage,
});

function ProductDetailPage() {
  const { product } = Route.useLoaderData();
  const related = getRelatedProducts(product);

  return (
    <PageShell>
      <nav aria-label="Breadcrumb" className="mb-8 font-mono text-xs text-muted-foreground">
        <Link to="/agents" className="hover:text-foreground">Agents</Link>
        <span aria-hidden="true"> / </span>
        <Link to="/shop" className="hover:text-foreground">Catalogue</Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page" className="text-foreground">{product.slug}</span>
      </nav>

      <ProductHeader product={product} />

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <DetailList title="Core outcomes" items={product.coreOutcomes} />
          <DetailList title="Requirements" items={product.requirements} description="Preconditions an agent should verify before selecting this capability." />
          <DetailList title="Boundaries" items={product.boundaries} description="Published limitations that constrain safe use." />
        </div>

        <div className="space-y-6">
          <SourceNotice product={product} />
          {product.slug === SUBCONTRACTING_CAPABILITY_SLUG ? (
            <section className="rounded-lg border border-border bg-surface p-5">
              <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Separate implementation provider
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {SUBCONTRACTING_PROVIDER_NAME} publishes its own agent-facing service and quote-first work
                boundaries. This capability record is guidance, not a booking, purchase or grant of repository access.
              </p>
              <a href={SUBCONTRACTING_SERVICE_GUIDE} className="mt-3 block text-sm font-medium text-primary underline underline-offset-4">
                Inspect the provider’s subcontracting guide
              </a>
              <a href={SUBCONTRACTING_SERVICE_CATALOGUE} className="mt-2 block font-mono text-xs text-muted-foreground underline underline-offset-4">
                Read the provider’s live machine service catalogue
              </a>
            </section>
          ) : null}

          <section className="rounded-lg border border-border bg-surface p-5">
            <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Machine-readable</h2>
            <a href={`/raw/products/${product.slug}.md`} className="mt-3 block font-mono text-xs hover:underline">metadata Markdown</a>
            <a href="/catalog.json" className="mt-2 block font-mono text-xs hover:underline">canonical catalogue JSON</a>
            <a href="/agents.txt" className="mt-2 block font-mono text-xs hover:underline">agent discovery text</a>
          </section>
          <section className="rounded-lg border border-border bg-surface p-5">
            <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Tags</h2>
            <ul className="mt-3 flex list-none flex-wrap gap-2">
              {product.tags.map((tag) => <li key={tag} className="font-mono text-xs text-muted-foreground">#{tag}</li>)}
            </ul>
          </section>
        </div>
      </div>

      <div className="mt-16"><RelatedProducts products={related} /></div>
    </PageShell>
  );
}
