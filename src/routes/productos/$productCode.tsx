
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, FileText, ShieldCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { productService, equipmentService, documentService } from "@/services";
import { EquipmentStatusBadge } from "@/components/common/StatusBadge";
import { getCategoryName, getManufacturerName } from "@/data/mock/categories";

export const Route = createFileRoute("/productos/$productCode")({ component: ProductDetailPage });

function ProductDetailPage() {
  const { productCode } = Route.useParams();
  const product = useQuery({ queryKey: ["product", productCode], queryFn: () => productService.getProductByCode(productCode) });
  const equipment = useQuery({ queryKey: ["product-equipment", productCode], queryFn: async () => {
    const p = await productService.getProductByCode(productCode);
    return p ? equipmentService.getEquipment({ productId: p.id }) : [];
  }});
  const docs = useQuery({ queryKey: ["product-documents", productCode], queryFn: async () => {
    const p = await productService.getProductByCode(productCode);
    return p ? documentService.getDocumentsByProduct(p.id) : [];
  }});
  const p = product.data;
  if (!p) return <div className="panel p-8 text-center"><h1 className="font-bold">Producto no encontrado</h1><Link to="/productos" className="mt-3 inline-block text-primary">Volver al catálogo</Link></div>;
  const primary = p.images.find((i) => i.isPrimary) ?? p.images[0];
  const primaryImageUrl = primary?.url ?? "/epp-harness.jpg";
  const primaryImageAlt = primary?.alt ?? `${p.name} — imagen pendiente de agregar`;

  return <div className="space-y-5">
    <Link to="/productos" className="inline-flex items-center gap-2 text-sm font-semibold text-primary"><ArrowLeft className="h-4 w-4" /> Catálogo</Link>
    <div className="grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
      <div className="panel overflow-hidden"><img src={primaryImageUrl} alt={primaryImageAlt} className="aspect-[4/3] w-full object-cover" /></div>
      <div>
        <p className="mono-code text-xs text-muted-foreground">{p.code} · {p.model}</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold">{p.name}</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{p.description}</p>
        <div className="mt-4 flex flex-wrap gap-2">{p.standards.map((s) => <span key={s} className="rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-semibold">{s}</span>)}</div>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Info label="Categoría" value={getCategoryName(p.categoryId)} /><Info label="Fabricante" value={getManufacturerName(p.manufacturerId)} /><Info label="Uso" value={p.usage} /><Info label="Vida útil" value={p.serviceLife} />
        </div>
      </div>
    </div>
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="panel p-5"><h2 className="font-display font-bold">Características</h2><ul className="mt-3 space-y-2 text-sm">{p.features.map((f) => <li key={f} className="flex gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{f}</li>)}</ul></section>
      <section className="panel p-5"><h2 className="font-display font-bold">Especificaciones</h2><dl className="mt-3 divide-y divide-border text-sm">{p.specifications.map((s) => <div key={s.label} className="flex justify-between gap-4 py-2"><dt className="text-muted-foreground">{s.label}</dt><dd className="font-semibold text-right">{s.value}</dd></div>)}</dl></section>
    </div>
    <section className="panel overflow-hidden">
      <div className="border-b border-border px-5 py-4"><h2 className="font-display font-bold">Unidades registradas</h2><p className="mt-1 text-xs text-muted-foreground">{equipment.data?.length ?? 0} unidades físicas asociadas a este producto.</p></div>
      <div className="divide-y divide-border">{(equipment.data ?? []).map((e) => <Link key={e.id} to="/equipos/unidad/$internalCode" params={{ internalCode: e.internalCode }} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-muted/30"><span><span className="mono-code text-xs">{e.internalCode}</span><span className="ml-3 text-xs text-muted-foreground">{e.serialNumber}</span></span><EquipmentStatusBadge status={e.status} size="sm" /></Link>)}</div>
    </section>
    <section className="panel p-5"><h2 className="flex items-center gap-2 font-display font-bold"><FileText className="h-4 w-4 text-primary" /> Documentación técnica</h2><div className="mt-3 grid gap-2 sm:grid-cols-2">{(docs.data ?? []).map((d) => <div key={d.id} className="rounded-md border border-border p-3 text-sm"><p className="font-semibold">{d.title}</p><p className="mt-1 text-xs text-muted-foreground">Versión {d.version} · {d.fileSize}</p></div>)}</div></section>
  </div>;
}
function Info({ label, value }: { label: string; value: string }) { return <div className="rounded-md border border-border p-3"><p className="label-caps">{label}</p><p className="mt-1 text-sm font-semibold">{value}</p></div>; }
