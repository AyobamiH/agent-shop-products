import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/PageShell";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { getFeaturedProducts } from "@/domain/catalog/featured";
import { catalogMeta, listCategories } from "@/domain/catalog/repository";
import { categoryLabel } from "@/domain/catalog/facets";
import { ProductList } from "@/features/catalog-browse/components/ProductList";
import { MachineSurfaces } from "@/features/agent-discovery/components/MachineSurfaces";
import { buildMeta } from "@/lib/seo/meta";
import { PRODUCT_HEADLINE, SITE_DESCRIPTOR, PRODUCT_SUPPORTING } from "@/lib/site";

const TITLE = `${SITE_DESCRIPTOR} — prompts and skills with published boundaries`;

export const Route = createFileRoute("/")({
  head: () => ({ meta: buildMeta({ title: TITLE, description: PRODUCT_HEADLINE }) }),
  component: HomePage,
});

function HomePage() {
  const featured = getFeaturedProducts();
  const categories = listCategories();

  return (
    <PageShell>
      <section>
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          {catalogMeta.productCount} source-backed products
        </p>
        <h1 className="mt-4 max-w-3xl text-balance text-4xl font-semibold leading-tight sm:text-5xl">
          {PRODUCT_HEADLINE}
        </h1>
        <p className="mt-5 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground">
          {PRODUCT_SUPPORTING}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/shop"
            className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
          >
            Browse the catalogue
          </Link>
          <Link
            to="/problems"
            className="rounded-md border border-border px-4 py-2 text-sm font-medium"
          >
            Start from a problem
          </Link>
        </div>
      </section>

      <section className="mt-16">
        <SectionHeading
          eyebrow="Featured"
          title="Selected products"
          description="A curated span across distinct categories. There are no rankings, ratings or sales figures, so none are shown."
        />
        <ProductList className="mt-6" products={featured} />
      </section>

      <section className="mt-16">
        <SectionHeading
          eyebrow="Categories"
          title="Where these products apply"
          description="Categories come from the catalogue itself."
        />
        <ul className="mt-6 flex list-none flex-wrap gap-2">
          {categories.map((category) => (
            <li key={category}>
              <Link
                to="/shop"
                className="inline-block rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                {categoryLabel(category)}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-16">
        <SectionHeading
          eyebrow="For agents"
          title="Machine-readable surfaces"
          description="The same catalogue that renders these pages is published for machine consumers."
        />
        <div className="mt-6">
          <MachineSurfaces exampleSlug={featured[0]?.slug} />
        </div>
      </section>
    </PageShell>
  );
}