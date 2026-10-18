
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { inventoryService } from "@/services";
import { SectionCard } from "@/components/common/SectionCard";

export const Route = createFileRoute("/inventario")({ component: InventoryPage });

function InventoryPage() {
  const { data } = useQuery({ queryKey: ["inventory"], queryFn: inventoryService.getInventory });
  const totals = (data ?? []).reduce((a, r) => ({ total:a.total+r.total, available:a.available+r.available, assigned:a.assigned+r.assigned, maintenance:a.maintenance+r.maintenance, out:a.out+r.outOfService }), {total:0,available:0,assigned:0,maintenance:0,out:0});
  return <div className="space-y-5"><header><p className="label-caps">Control de existencias</p><h1 className="mt-1 font-display text-2xl font-extrabold">Inventario</h1><p className="mt-1 text-sm text-muted-foreground">Resumen por producto de las unidades individuales registradas.</p></header><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{Object.entries({Total:totals.total,Disponibles:totals.available,Asignados:totals.assigned,"En control":totals.maintenance,"Fuera de servicio":totals.out}).map(([l,v])=><div key={l} className="panel p-4"><p className="label-caps">{l}</p><p className="mt-1 text-2xl font-bold">{v}</p></div>)}</div><SectionCard title="Inventario por producto"><div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="border-b border-border bg-muted/50 text-xs uppercase text-muted-foreground"><tr>{["Producto","Total","Disponibles","Asignados","En control","Fuera de servicio"].map(x=><th key={x} className="px-4 py-3 font-semibold">{x}</th>)}</tr></thead><tbody className="divide-y divide-border">{(data??[]).map(r=><tr key={r.productId}><td className="px-4 py-3 font-semibold">{r.productName}<div className="mono-code text-[11px] text-muted-foreground">{r.productCode}</div></td><td className="px-4 py-3">{r.total}</td><td className="px-4 py-3">{r.available}</td><td className="px-4 py-3">{r.assigned}</td><td className="px-4 py-3">{r.maintenance}</td><td className="px-4 py-3">{r.outOfService}</td></tr>)}</tbody></table></div></SectionCard></div>;
}
