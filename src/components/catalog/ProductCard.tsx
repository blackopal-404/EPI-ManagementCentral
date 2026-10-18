import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import type { Product } from "@/types";
import { getCategoryName, getManufacturerName } from "@/data/mock/categories";
import { StatusPill, productStatusMeta } from "@/components/common/StatusBadge";

export function ProductCard({ product }: { product: Product }) {
  const primary = product.images.find((i) => i.isPrimary) ?? product.images[0];
  const meta = productStatusMeta[product.status];
  const imageUrl = primary?.url || "/epp-harness.jpg";
  const imageAlt = primary?.alt || `${product.name} — imagen pendiente de agregar`;

  return (
    <article className="group panel flex flex-col overflow-hidden transition-shadow hover:shadow-panel">
      <Link
        to="/productos/$productCode"
        params={{ productCode: product.code }}
        className="block focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        aria-label={`Ver ficha de ${product.name}`}
      >
        <div className="aspect-[4/3] overflow-hidden bg-muted">
          <img
            src={imageUrl}
            alt={imageAlt}
            loading="lazy"
            width={1024}
            height={1024}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
          <p className="mono-code min-w-0 truncate text-xs text-muted-foreground">{product.code}</p>
          <StatusPill label={meta.label} tone={meta.tone} size="sm" />
        </div>
        <h3 className="text-base leading-snug font-bold">
          <Link
            to="/productos/$productCode"
            params={{ productCode: product.code }}
            className="hover:text-primary"
          >
            {product.name}
          </Link>
        </h3>
        <dl className="grid grid-cols-2 gap-2 text-xs">
          <div className="min-w-0">
            <dt className="label-caps">Categoría</dt>
            <dd className="truncate font-medium">{getCategoryName(product.categoryId)}</dd>
          </div>
          <div className="min-w-0">
            <dt className="label-caps">Fabricante</dt>
            <dd className="truncate font-medium">{getManufacturerName(product.manufacturerId)}</dd>
          </div>
        </dl>
        <Link
          to="/productos/$productCode"
          params={{ productCode: product.code }}
          className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:gap-2.5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          Ver ficha
          <ArrowRight className="h-4 w-4 transition-all" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
