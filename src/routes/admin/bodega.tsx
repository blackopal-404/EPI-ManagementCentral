import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, type FormEvent } from "react";
import { Edit3, PackagePlus, Trash2, Warehouse, AlertTriangle } from "lucide-react";
import { warehouseService } from "@/services";
import type { WarehouseProduct } from "@/types";
import { useAuth } from "@/lib/auth";
import { mockProducts } from "@/data/mock/products";

export const Route = createFileRoute("/admin/bodega")({ component: WarehouseAdminPage });

const blank = (): WarehouseProduct => ({ id: `wh-${Date.now()}`, productId: "", sku: "", name: "", description: "", image: "/epp-harness.jpg", quantity: 0, minStock: 1, costPrice: 0, salePrice: 0, location: "Bodega principal", supplier: "", leadTimeDays: 30, safetyStock: 0, maxStock: undefined, minPurchaseQuantity: 1, purchaseMultiple: 1, dailyDemandEstimate: undefined, demandEstimateNotes: "", currency: "HNL", active: true, updatedAt: new Date().toISOString().slice(0, 10) });

function WarehouseAdminPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["warehouse-admin"], queryFn: warehouseService.getProducts });
  const [editing, setEditing] = useState<WarehouseProduct | null>(null);
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => data.filter(x => `${x.sku} ${x.name} ${x.location}`.toLowerCase().includes(query.toLowerCase())), [data, query]);
  if (user?.role !== "magna") return <div className="panel p-6"><h1 className="font-display text-xl font-extrabold">Área restringida</h1><p className="mt-2 text-sm text-muted-foreground">Esta sección solo está disponible para el usuario Magna.</p></div>;
  async function save(item: WarehouseProduct) { await warehouseService.upsertProduct({ ...item, updatedAt: new Date().toISOString().slice(0, 10) }); setEditing(null); qc.invalidateQueries({ queryKey: ["warehouse-admin"] }); }
  async function remove(id: string) { if (!confirm("¿Eliminar este producto de bodega?")) return; await warehouseService.deleteProduct(id); qc.invalidateQueries({ queryKey: ["warehouse-admin"] }); }
  return <div className="space-y-5 pb-10"><header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="label-caps">Solo Magna</p><h1 className="mt-1 font-display text-2xl font-extrabold">Inventario de bodega</h1><p className="mt-1 max-w-2xl text-sm text-muted-foreground">Administra existencias disponibles para distribución, costo, precio de venta, ubicación y proveedor.</p></div><button onClick={() => setEditing(blank())} className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground"><PackagePlus className="h-4 w-4"/> Agregar producto</button></header><div className="grid gap-3 sm:grid-cols-3"><Metric label="Productos" value={data.length}/><Metric label="Unidades" value={data.reduce((a,x)=>a+x.quantity,0)}/><Metric label="Stock bajo" value={data.filter(x=>x.quantity<=x.minStock).length}/></div><div className="panel p-4"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar SKU, producto o ubicación…" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"/></div><div className="panel overflow-hidden"><div className="overflow-x-auto"><table className="w-full min-w-[980px] text-left text-sm"><thead className="bg-muted/50 text-xs uppercase text-muted-foreground"><tr>{["Producto","Existencia","Costo","Venta","Margen","Ubicación","Acciones"].map(h=><th key={h} className="px-4 py-3">{h}</th>)}</tr></thead><tbody className="divide-y divide-border">{filtered.map(x=>{const margin=x.salePrice-x.costPrice; return <tr key={x.id}><td className="px-4 py-3"><div className="flex items-center gap-3"><img src={x.image} className="h-12 w-12 rounded-md object-cover"/><div><p className="font-semibold">{x.name}</p><p className="mono-code text-[11px] text-muted-foreground">{x.sku}</p></div></div></td><td className="px-4 py-3"><span className={x.quantity<=x.minStock?"font-bold text-danger":"font-semibold"}>{x.quantity}</span>{x.quantity<=x.minStock&&<span className="ml-2 inline-flex items-center gap-1 text-[11px] text-danger"><AlertTriangle className="h-3 w-3"/> bajo</span>}</td><td className="px-4 py-3">${x.costPrice.toFixed(2)}</td><td className="px-4 py-3 font-semibold">${x.salePrice.toFixed(2)}</td><td className="px-4 py-3">${margin.toFixed(2)}</td><td className="px-4 py-3">{x.location}</td><td className="px-4 py-3"><div className="flex gap-2"><button onClick={()=>setEditing(x)} className="rounded-md border border-border p-2 hover:bg-muted" aria-label="Editar"><Edit3 className="h-4 w-4"/></button><button onClick={()=>remove(x.id)} className="rounded-md border border-danger/20 p-2 text-danger hover:bg-danger-soft" aria-label="Eliminar"><Trash2 className="h-4 w-4"/></button></div></td></tr>})}</tbody></table></div></div>{editing&&<WarehouseForm value={editing} onCancel={()=>setEditing(null)} onSave={save}/>}</div>;
}
function Metric({label,value}:{label:string;value:number}){return <div className="panel p-4"><p className="label-caps">{label}</p><p className="mt-1 font-display text-2xl font-extrabold">{value}</p></div>; }

function WarehouseForm({value,onCancel,onSave}:{value:WarehouseProduct;onCancel:()=>void;onSave:(v:WarehouseProduct)=>void}) {
  const [v,setV] = useState(value);
  // Mantener texto temporal permite borrar y volver a escribir números en móvil
  // sin que Number("") fuerce inmediatamente el campo a 0.
  const [numbers,setNumbers] = useState({
    quantity: String(value.quantity ?? 0),
    minStock: String(value.minStock ?? 0),
    costPrice: String(value.costPrice ?? 0),
    salePrice: String(value.salePrice ?? 0),
    dailyDemandEstimate: value.dailyDemandEstimate == null ? "" : String(value.dailyDemandEstimate),
    leadTimeDays: String(value.leadTimeDays ?? 30),
    safetyStock: String(value.safetyStock ?? 0),
    maxStock: value.maxStock == null ? "" : String(value.maxStock),
    minPurchaseQuantity: String(value.minPurchaseQuantity ?? 1),
    purchaseMultiple: String(value.purchaseMultiple ?? 1),
  });
  const set=(k:keyof WarehouseProduct,val:unknown)=>setV(x=>({...x,[k]:val}));
  const setNumber=(k:keyof typeof numbers,val:string)=>setNumbers(x=>({...x,[k]:val}));
  const numericProps = { inputMode: "decimal" as const, autoComplete: "off", className: "min-w-0 h-11 w-full rounded-md border border-input bg-background px-3 text-base font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-10 sm:text-sm" };
  const parseNumber=(raw:string,fallback=0)=>raw.trim()===""?fallback:Number.isFinite(Number(raw))?Number(raw):fallback;
  const submit=(e:FormEvent<HTMLFormElement>)=>{
    e.preventDefault();
    onSave({
      ...v,
      quantity: Math.max(0,parseNumber(numbers.quantity)),
      minStock: Math.max(0,parseNumber(numbers.minStock)),
      costPrice: Math.max(0,parseNumber(numbers.costPrice)),
      salePrice: Math.max(0,parseNumber(numbers.salePrice)),
      dailyDemandEstimate: numbers.dailyDemandEstimate.trim()==="" ? undefined : Math.max(0,parseNumber(numbers.dailyDemandEstimate)),
      leadTimeDays: Math.max(0,parseNumber(numbers.leadTimeDays,30)),
      safetyStock: Math.max(0,parseNumber(numbers.safetyStock)),
      maxStock: numbers.maxStock.trim()==="" ? undefined : Math.max(0,parseNumber(numbers.maxStock)),
      minPurchaseQuantity: Math.max(0,parseNumber(numbers.minPurchaseQuantity,1)),
      purchaseMultiple: Math.max(1,parseNumber(numbers.purchaseMultiple,1)),
    });
  };
  return <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto overscroll-contain bg-black/50 p-0 sm:items-center sm:p-4">
    <form onSubmit={submit} className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto overscroll-contain rounded-t-xl bg-card p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-panel sm:max-h-[90vh] sm:rounded-xl sm:p-5">
      <div className="flex items-center gap-3"><Warehouse className="h-5 w-5 shrink-0 text-primary"/><div><h2 className="font-display text-lg font-extrabold">{value.name?"Editar producto":"Nuevo producto"}</h2><p className="text-xs text-muted-foreground">Los datos quedan guardados localmente en esta V1.</p></div></div>
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="space-y-1 text-sm font-semibold sm:col-span-2"><span>Vincular con producto del catálogo</span><select value={v.productId} onChange={e=>{const p=mockProducts.find(x=>x.id===e.target.value);if(p)setV(x=>({...x,productId:p.id,name:p.name,sku:p.sku||p.code,image:p.images.find(i=>i.isPrimary)?.url||x.image}));else set("productId",e.target.value)}} className="h-11 w-full min-w-0 rounded-md border border-input bg-background px-3 text-base font-normal sm:h-10 sm:text-sm"><option value="">Producto independiente de bodega</option>{mockProducts.map(p=><option key={p.id} value={p.id}>{p.code} · {p.name}</option>)}</select></label>
        {([ ["name","Nombre del producto"],["sku","SKU / código"],["location","Ubicación"],["supplier","Proveedor"],["image","URL de imagen"] ] as const).map(([k,l])=><label key={k} className="min-w-0 space-y-1 text-sm font-semibold"><span>{l}</span><input value={String(v[k]??"")} onChange={e=>set(k,e.target.value)} className="h-11 w-full min-w-0 rounded-md border border-input bg-background px-3 text-base font-normal sm:h-10 sm:text-sm" required={k!=="supplier"}/></label>)}
        <label className="min-w-0 space-y-1 text-sm font-semibold"><span>Cantidad</span><input {...numericProps} type="number" inputMode="numeric" min="0" step="1" value={numbers.quantity} onChange={e=>setNumber("quantity",e.target.value)}/></label>
        <label className="min-w-0 space-y-1 text-sm font-semibold"><span>Stock mínimo</span><input {...numericProps} type="number" inputMode="numeric" min="0" step="1" value={numbers.minStock} onChange={e=>setNumber("minStock",e.target.value)}/></label>
        <label className="min-w-0 space-y-1 text-sm font-semibold"><span>Precio costo</span><input {...numericProps} type="number" min="0" step="0.01" value={numbers.costPrice} onChange={e=>setNumber("costPrice",e.target.value)}/></label>
        <label className="min-w-0 space-y-1 text-sm font-semibold"><span>Precio venta</span><input {...numericProps} type="number" min="0" step="0.01" value={numbers.salePrice} onChange={e=>setNumber("salePrice",e.target.value)}/></label>
        <div className="mt-2 border-t border-border pt-4 sm:col-span-2"><h3 className="font-display font-bold">Parámetros de reposición</h3><p className="mt-1 text-xs text-muted-foreground">La demanda es una estimación manual hasta conectar ventas históricas reales.</p></div>
        <label className="min-w-0 space-y-1 text-sm font-semibold"><span>Demanda diaria estimada (unidades)</span><input {...numericProps} type="number" min="0" step="0.01" value={numbers.dailyDemandEstimate} onChange={e=>setNumber("dailyDemandEstimate",e.target.value)} placeholder="Sin estimación"/></label>
        <label className="min-w-0 space-y-1 text-sm font-semibold"><span>Plazo de reposición (días)</span><input {...numericProps} type="number" inputMode="numeric" min="0" step="1" value={numbers.leadTimeDays} onChange={e=>setNumber("leadTimeDays",e.target.value)}/></label>
        <label className="min-w-0 space-y-1 text-sm font-semibold"><span>Stock de seguridad</span><input {...numericProps} type="number" inputMode="numeric" min="0" step="1" value={numbers.safetyStock} onChange={e=>setNumber("safetyStock",e.target.value)}/></label>
        <label className="min-w-0 space-y-1 text-sm font-semibold"><span>Stock máximo (opcional)</span><input {...numericProps} type="number" inputMode="numeric" min="0" step="1" value={numbers.maxStock} onChange={e=>setNumber("maxStock",e.target.value)} placeholder="Sin límite"/></label>
        <label className="min-w-0 space-y-1 text-sm font-semibold"><span>Compra mínima</span><input {...numericProps} type="number" inputMode="numeric" min="0" step="1" value={numbers.minPurchaseQuantity} onChange={e=>setNumber("minPurchaseQuantity",e.target.value)}/></label>
        <label className="min-w-0 space-y-1 text-sm font-semibold"><span>Múltiplo de compra</span><input {...numericProps} type="number" inputMode="numeric" min="1" step="1" value={numbers.purchaseMultiple} onChange={e=>setNumber("purchaseMultiple",e.target.value)}/></label>
        <label className="min-w-0 space-y-1 text-sm font-semibold"><span>Moneda de costo</span><select value={v.currency ?? "HNL"} onChange={e=>set("currency",e.target.value)} className="h-11 w-full min-w-0 rounded-md border border-input bg-background px-3 text-base font-normal sm:h-10 sm:text-sm"><option value="HNL">HNL · Lempiras</option><option value="USD">USD · Dólares</option><option value="EUR">EUR · Euros</option></select></label>
        <label className="min-w-0 space-y-1 text-sm font-semibold sm:col-span-2"><span>Notas de estimación de demanda</span><input value={v.demandEstimateNotes ?? ""} onChange={e=>set("demandEstimateNotes",e.target.value)} placeholder="Ej. estimación del equipo comercial; no son ventas confirmadas" className="h-11 w-full min-w-0 rounded-md border border-input bg-background px-3 text-base font-normal sm:h-10 sm:text-sm"/></label>
      </div>
      <label className="mt-4 block space-y-1 text-xs font-semibold"><span>Subir imagen del producto</span><input type="file" accept="image/*" onChange={e=>{const f=e.target.files?.[0];if(f){const r=new FileReader();r.onload=()=>set("image",String(r.result));r.readAsDataURL(f)}}} className="w-full text-xs"/></label>
      <div className="sticky bottom-0 -mx-4 mt-6 flex justify-end gap-2 border-t border-border bg-card px-4 pt-4 sm:static sm:mx-0 sm:border-0 sm:px-0 sm:pt-0"><button type="button" onClick={onCancel} className="min-h-11 rounded-md border border-border px-4 py-2 text-sm font-bold">Cancelar</button><button type="submit" className="min-h-11 rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">Guardar producto</button></div>
    </form>
  </div>;
}

