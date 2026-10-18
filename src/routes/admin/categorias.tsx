
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { categoryService } from "@/services";
import { SectionCard } from "@/components/common/SectionCard";

export const Route=createFileRoute("/admin/categorias")({component:AdminCategories});
function AdminCategories(){const{data}=useQuery({queryKey:["admin-categories"],queryFn:categoryService.getCategories});return <div className="space-y-5"><header><p className="label-caps">Administración</p><h1 className="mt-1 font-display text-2xl font-extrabold">Categorías</h1></header><SectionCard title="Clasificación del catálogo"><div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">{(data??[]).map(c=><div key={c.id} className="rounded-md border border-border p-4"><p className="label-caps">Orden {c.order}</p><h2 className="mt-1 font-semibold">{c.name}</h2><p className="mt-1 text-sm text-muted-foreground">{c.description}</p></div>)}</div></SectionCard></div>}
