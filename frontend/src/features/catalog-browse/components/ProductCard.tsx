import { Link } from "@tanstack/react-router";
import { categoryLabel } from "@/domain/catalog/facets";
import type { Product } from "@/domain/catalog/types";
import { humanizeSlug } from "@/lib/text/normalize";
import { MetaChip } from "./MetaChip";

const MAX_VISIBLE_TAGS = 3;

export function ProductCard({ product }: { product: Product }) {
  const hiddenTagCount = product.tags.length - MAX_VISIBLE_TAGS;

  return (
    <article className="group relative flex h-full flex-col rounded-lg border border-border bg-surface p-5 transition-colors hover:border-foreground/25">
      <div className="flex flex-wrap items-center gap-2">
        <MetaChip>{humanizeSlug(product.productType)}</MetaChip>
        <MetaChip>{categoryLabel(product.category)}</MetaChip>
      </div>

      <h3 className="mt-4 text-base font-semibold leading-snug">
        <Link
          to="/products/$slug"
          params={{ slug: product.slug }}
          className="after:absolute after:inset-0 after:content-['']"
        >
          {product.name}
        </Link>
      </h3>

      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{product.summary}</p>

      <div className="mt-auto pt-5">
        <div className="flex flex-wrap gap-1.5 border-t border-border pt-4">
          {product.tags.slice(0, MAX_VISIBLE_TAGS).map((tag) => (
            <span key={tag} className="font-mono text-[11px] text-muted-foreground">
              #{tag}
            </span>
          ))}
          {hiddenTagCount > 0 ? (
            <span className="font-mono text-[11px] text-muted-foreground">+{hiddenTagCount}</span>
          ) : null}
        </div>
      </div>
    </article>
  );
}