
import type { Product } from "@/types";
import { ProductCard } from "./ProductCard";

export function ProductGrid({ products }: { products: Product[] }) {
  if (!products.length) {
    return <div className="panel p-8 text-center text-sm text-muted-foreground">No se encontraron productos con esos criterios.</div>;
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => <ProductCard key={product.id} product={product} />)}
    </div>
  );
}
