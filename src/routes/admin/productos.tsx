import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ImagePlus } from "lucide-react";
import { productService } from "@/services";
import { SectionCard } from "@/components/common/SectionCard";

export const Route = createFileRoute("/admin/productos")({ component: AdminProducts });
function AdminProducts() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["admin-products"], queryFn: () => productService.getProducts() });
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function saveImage(productId: string, file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setMessage("Selecciona un archivo de imagen válido."); return; }
    if (file.size > 2 * 1024 * 1024) { setMessage("La imagen debe pesar 2 MB o menos."); return; }
    setSavingId(productId); setMessage("");
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("No se pudo leer la imagen."));
        reader.onerror = () => reject(new Error("No se pudo leer la imagen."));
        reader.readAsDataURL(file);
      });
      await productService.saveProductImage(productId, dataUrl);
      await qc.invalidateQueries({ queryKey: ["admin-products"] });
      await qc.invalidateQueries({ queryKey: ["products"] });
      setMessage("Imagen guardada en este navegador.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "No se pudo guardar la imagen."); }
    finally { setSavingId(null); }
  }

  return <div className="space-y-5">
    <header><p className="label-caps">Administración</p><h1 className="mt-1 font-display text-2xl font-extrabold">Productos</h1><p className="mt-1 text-sm text-muted-foreground">Agrega o reemplaza la imagen principal de cada producto.</p></header>
    {message && <p role="status" className="rounded-md border border-border bg-muted p-3 text-sm">{message}</p>}
    <SectionCard title="Catálogo"><div className="overflow-x-auto"><table className="w-full min-w-[820px] text-left text-sm"><thead className="bg-muted/50 text-xs uppercase text-muted-foreground"><tr>{["Imagen","Código","Producto","Modelo","Tipo","Estado","Actualizar imagen"].map(x=><th key={x} className="px-4 py-3">{x}</th>)}</tr></thead><tbody className="divide-y divide-border">{data.map(p=>{const primary=p.images.find(i=>i.isPrimary)??p.images[0];return <tr key={p.id}><td className="px-4 py-3"><img src={primary?.url??"/epp-harness.jpg"} alt={primary?.alt??p.name} className="h-12 w-12 rounded object-cover"/></td><td className="mono-code px-4 py-3">{p.code}</td><td className="px-4 py-3 font-semibold">{p.name}</td><td className="px-4 py-3">{p.model}</td><td className="px-4 py-3">{p.equipmentType}</td><td className="px-4 py-3">{p.status}</td><td className="px-4 py-3"><label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-xs font-bold hover:bg-muted"><ImagePlus className="h-4 w-4"/>{savingId===p.id?"Guardando…":"Elegir imagen"}<input type="file" accept="image/*" disabled={savingId===p.id} className="sr-only" onChange={e=>{void saveImage(p.id,e.currentTarget.files?.[0]);e.currentTarget.value=""}}/></label><p className="mt-1 text-[10px] text-muted-foreground">Máximo 2 MB</p></td></tr>})}</tbody></table>{data.length===0&&<p className="p-6 text-sm text-muted-foreground">No hay productos disponibles en este entorno. Conecta el backend/base de datos para administrar el catálogo de producción.</p>}</div></SectionCard>
    <p className="text-xs text-muted-foreground">Nota: esta versión guarda la imagen en el almacenamiento local de este navegador. No se sincroniza entre usuarios ni dispositivos; para producción, el almacenamiento debe conectarse al backend.</p>
  </div>;
}
