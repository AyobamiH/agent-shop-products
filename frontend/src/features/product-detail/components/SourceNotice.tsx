import { catalogSource } from "@/domain/catalog/source";
import type { Product } from "@/domain/catalog/types";

/**
 * States where the record comes from. Per-product provenance (blob SHAs,
 * origin branches) lives in the upstream repository's catalog/sources.json and
 * is deliberately not duplicated or inferred here.
 */
export function SourceNotice({ product }: { product: Product }) {
  const { repository, branch } = catalogSource.upstream;

  return (
    <section className="rounded-lg border border-border bg-surface p-5">
      <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
        Catalogue source
      </h2>
      <dl className="mt-3 space-y-2 text-sm">
        <Row label="Repository" value={`${repository} (${branch})`} />
        {product.sourcePath ? <Row label="Payload path" value={product.sourcePath} /> : null}
      </dl>
      <p className="mt-4 border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground">
        Price, ratings, reviews and the full prompt body are not published. Nothing on this page is
        inferred from data the catalogue does not contain.
      </p>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap gap-x-2">
      <dt className="text-muted-foreground">{label}:</dt>
      <dd className="break-all font-medium">{value}</dd>
    </div>
  );
}