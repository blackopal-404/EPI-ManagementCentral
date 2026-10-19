
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { categoryService, equipmentService, productService } from "@/services";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/categorias/")({ component: CategoriesPage });

function CategoriesPage() {
  const { data: cats } = useQuery({ queryKey: ["categories"], queryFn: categoryService.getCategories });
  const { data: equipment } = useQuery({ queryKey: ["equipment"], queryFn: () => equipmentService.getEquipment() });
  const { data: products } = useQuery({ queryKey: ["products"], queryFn: () => productService.getProducts() });
  return <div className="space-y-5"><header><p className="label-caps">Clasificación</p><h1 className="mt-1 font-display text-2xl font-extrabold">Categorías</h1><p className="mt-1 text-sm text-muted-foreground">Organiza el catálogo por familias de equipos de seguridad.</p></header><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{(cats ?? []).map(c => { const count = (equipment ?? []).filter(e => { const p = (products ?? []).find(product => product.id === e.productId); return p?.categoryId === c.id; }).length; return <article key={c.id} className="panel overflow-hidden"><img src={c.image} alt="" className="aspect-[4/3] w-full object-cover" /><div className="p-4"><p className="label-caps">{count} unidades</p><h2 className="mt-1 font-display font-bold">{c.name}</h2><p className="mt-2 text-sm text-muted-foreground">{c.description}</p><Link to="/productos" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">Ver productos <ArrowRight className="h-4 w-4"/></Link></div></article>})}</div></div>;
}
