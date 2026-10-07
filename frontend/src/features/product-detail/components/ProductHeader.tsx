import { categoryLabel } from "@/domain/catalog/facets";
import type { Product } from "@/domain/catalog/types";
import { MetaChip } from "@/features/catalog-browse/components/MetaChip";
import { humanizeSlug } from "@/lib/text/normalize";

export function ProductHeader({ product }: { product: Product }) {
  return (
    <header>
      <div className="flex flex-wrap items-center gap-2">
        <MetaChip>{humanizeSlug(product.productType)}</MetaChip>
        <MetaChip>{categoryLabel(product.category)}</MetaChip>
      </div>
      <h1 className="mt-4 text-balance text-3xl font-semibold sm:text-4xl">{product.name}</h1>
      <p className="mt-4 max-w-3xl text-pretty text-base leading-relaxed text-muted-foreground">
        {product.summary}
      </p>
      <p className="mt-6 max-w-3xl border-l-2 border-border pl-4 text-sm leading-relaxed">
        <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Problem
        </span>
        <br />
        {product.problem}
      </p>
    </header>
  );
}