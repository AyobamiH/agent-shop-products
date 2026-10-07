import type { Product } from "@/domain/catalog/types";
import { ProductList } from "@/features/catalog-browse/components/ProductList";

export function RelatedProducts({ products }: { products: readonly Product[] }) {
  if (products.length === 0) return null;

  return (
    <section>
      <h2 className="text-xl font-semibold">Related products</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Selected by shared category and catalogue tags. No popularity or purchase signal exists.
      </p>
      <ProductList className="mt-5" products={products} />
    </section>
  );
}