import type { Product } from "@/domain/catalog/types";
import { cn } from "@/lib/utils";
import { ProductCard } from "./ProductCard";

export function ProductList({
  products,
  className,
  columns = 3,
}: {
  products: readonly Product[];
  className?: string;
  columns?: 2 | 3;
}) {
  return (
    <ul
      className={cn(
        "grid list-none gap-4 sm:grid-cols-2",
        columns === 3 ? "lg:grid-cols-3" : null,
        className,
      )}
    >
      {products.map((product) => (
        <li key={product.id} className="contents">
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  );
}