
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { productService } from "@/services";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { Search } from "lucide-react";

export const Route = createFileRoute("/productos/")({ component: ProductsPage });

function ProductsPage() {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const q = useQuery({ queryKey: ["products", search, categoryId], queryFn: () => productService.getProducts({ search, categoryId }) });
  return <div className="space-y-5">
    <header><p className="label-caps">Catálogo técnico</p><h1 className="mt-1 font-display text-2xl font-extrabold">Productos</h1><p className="mt-1 text-sm text-muted-foreground">Modelos de EPP/EPI que pueden tener múltiples unidades individuales.</p></header>
    <div className="grid gap-2 md:grid-cols-[1fr_260px]"><div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar producto, código o modelo…" className="h-10 w-full rounded-md border border-input pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring" /></div><CategorySelect value={categoryId} onChange={setCategoryId} /></div>
    <ProductGrid products={q.data ?? []} />
  </div>;
}
function CategorySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { data } = useQuery({ queryKey: ["categories"], queryFn: async () => (await import("@/services")).categoryService.getCategories() });
  return <select value={value} onChange={(e) => onChange(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="">Todas las categorías</option>{(data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>;
}
