import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { categoryLabel } from "@/domain/catalog/facets";
import type { Product } from "@/domain/catalog/types";
import { humanizeSlug } from "@/lib/text/normalize";
import { MetaChip } from "./MetaChip";

const MAX_VISIBLE_TAGS = 3;

export function ProductCard({ product }: { product: Product }) {
  const hiddenTagCount = product.tags.length - MAX_VISIBLE_TAGS;

  return (
    <article className="group relative flex h-full min-w-0 flex-col rounded-lg border border-border bg-surface p-5 transition-colors hover:border-primary/35 hover:bg-primary/[0.02]">
      <div className="flex flex-wrap items-center gap-2">
        <MetaChip>{humanizeSlug(product.productType)}</MetaChip>
        <MetaChip>{categoryLabel(product.category)}</MetaChip>
      </div>

      <h3 className="mt-4 text-base font-semibold leading-snug tracking-[-0.01em]">
        <Link
          to="/products/$slug"
          params={{ slug: product.slug }}
          className="after:absolute after:inset-0 after:content-['']"
        >
          {product.name}
        </Link>
      </h3>

      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{product.summary}</p>

      <div className="mt-5 border-t border-border pt-4">
        <p className="truncate font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
          {product.sourcePath}
        </p>
        <div className="mt-3 flex items-end justify-between gap-4">
          <div className="flex min-w-0 flex-wrap gap-x-2 gap-y-1">
            {product.tags.slice(0, MAX_VISIBLE_TAGS).map((tag) => (
              <span key={tag} className="font-mono text-[11px] text-muted-foreground">
                #{tag}
              </span>
            ))}
            {hiddenTagCount > 0 ? (
              <span className="font-mono text-[11px] text-muted-foreground">+{hiddenTagCount}</span>
            ) : null}
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary">
            inspect <ArrowUpRight className="size-3" aria-hidden="true" />
          </span>
        </div>
      </div>
    </article>
  );
}
