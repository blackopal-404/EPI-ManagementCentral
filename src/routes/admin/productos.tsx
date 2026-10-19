
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { productService } from "@/services";
import { SectionCard } from "@/components/common/SectionCard";

export const Route=createFileRoute("/admin/productos")({component:AdminProducts});
function AdminProducts(){const{data}=useQuery({queryKey:["admin-products"],queryFn:()=>productService.getProducts()});return <div className="space-y-5"><header><p className="label-caps">Administración</p><h1 className="mt-1 font-display text-2xl font-extrabold">Productos</h1></header><SectionCard title="Catálogo"><div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-muted/50 text-xs uppercase text-muted-foreground"><tr>{["Código","Producto","Modelo","Tipo","Estado"].map(x=><th key={x} className="px-4 py-3">{x}</th>)}</tr></thead><tbody className="divide-y divide-border">{(data??[]).map(p=><tr key={p.id}><td className="mono-code px-4 py-3">{p.code}</td><td className="px-4 py-3 font-semibold">{p.name}</td><td className="px-4 py-3">{p.model}</td><td className="px-4 py-3">{p.equipmentType}</td><td className="px-4 py-3">{p.status}</td></tr>)}</tbody></table></div></SectionCard></div>}
