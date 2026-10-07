import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/PageShell";
import { getProductBySlug } from "@/domain/catalog/repository";
import { getRelatedProducts } from "@/domain/catalog/related";
import { DetailList } from "@/features/product-detail/components/DetailList";
import { ProductHeader } from "@/features/product-detail/components/ProductHeader";
import { SourceNotice } from "@/features/product-detail/components/SourceNotice";
import { RelatedProducts } from "@/features/product-detail/components/RelatedProducts";
import { buildProductJsonLd } from "@/lib/jsonld/product";
import { buildMeta } from "@/lib/seo/meta";
import { SITE_DESCRIPTOR } from "@/lib/site";

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
          { title: `Product unavailable — ${SITE_DESCRIPTOR}` },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const { product } = loaderData;
    return {
      meta: buildMeta({
        title: `${product.name} — ${SITE_DESCRIPTOR}`,
        description: product.summary,
      }),
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(buildProductJsonLd(product)),
        },
      ],
    };
  },
  component: ProductDetailPage,
});

function ProductDetailPage() {
  const { product } = Route.useLoaderData();
  const related = getRelatedProducts(product);

  return (
    <PageShell>
      <nav aria-label="Breadcrumb" className="mb-8 font-mono text-xs text-muted-foreground">
        <Link to="/shop" className="hover:text-foreground">
          Catalogue
        </Link>
        <span aria-hidden="true"> / </span>
        <span className="text-foreground">{product.slug}</span>
      </nav>

      <ProductHeader product={product} />

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <DetailList title="Core outcomes" items={product.coreOutcomes} />
          <DetailList
            title="Requirements"
            items={product.requirements}
            description="What must already exist for this product to work."
          />
          <DetailList
            title="Boundaries"
            items={product.boundaries}
            description="Stated limitations. These are published, not hidden."
          />
        </div>

        <div className="space-y-6">
          <SourceNotice product={product} />

          <section className="rounded-lg border border-border bg-surface p-5">
            <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Machine-readable
            </h2>
            <a
              href={`/raw/products/${product.slug}.md`}
              className="mt-3 block font-mono text-xs hover:underline"
            >
              /raw/products/{product.slug}.md
            </a>
            <a href="/catalog.json" className="mt-2 block font-mono text-xs hover:underline">
              /catalog.json
            </a>
          </section>

          <section className="rounded-lg border border-border bg-surface p-5">
            <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Tags
            </h2>
            <ul className="mt-3 flex list-none flex-wrap gap-2">
              {product.tags.map((tag) => (
                <li key={tag} className="font-mono text-xs text-muted-foreground">
                  #{tag}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      <div className="mt-16">
        <RelatedProducts products={related} />
      </div>
    </PageShell>
  );
}