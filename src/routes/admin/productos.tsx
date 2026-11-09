import { ProductsModuleNav } from "@/components/admin/ProductsModuleNav";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { productModelService, type ProductModelRecord } from "@/services";
import { SectionCard } from "@/components/common/SectionCard";

export const Route=createFileRoute("/admin/productos")({component:AdminProducts});

function AdminProducts(){
  const qc=useQueryClient();
  const {data:models=[],isLoading}=useQuery({queryKey:["product-models"],queryFn:()=>productModelService.getModels()});
  const [creating,setCreating]=useState(false);
  const [form,setForm]=useState({name:"",brand:"",model:"",description:"",equipmentType:"",usage:"",trackingMode:"quantity" as "quantity"|"individual",referenceSalePrice:"0",currency:"HNL" as "HNL"|"USD"|"EUR",image:""});
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState("");
  async function save(e:FormEvent){e.preventDefault();setSaving(true);setError("");try{
    await productModelService.saveModel({...form,referenceSalePrice:Number(form.referenceSalePrice),features:[],specifications:[],materials:[],standards:[]});
    await qc.invalidateQueries({queryKey:["product-models"]});setCreating(false);setForm({name:"",brand:"",model:"",description:"",equipmentType:"",usage:"",trackingMode:"quantity",referenceSalePrice:"0",currency:"HNL",image:""});
  }catch(err){setError(err instanceof Error?err.message:"No se pudo guardar el modelo.");}finally{setSaving(false);}}
  return <div className="space-y-5"><header className="flex flex-wrap items-end justify-between gap-3"><div><p className="label-caps">Catálogo maestro</p><h1 className="mt-1 font-display text-2xl font-extrabold">Productos</h1><p className="mt-1 max-w-2xl text-sm text-muted-foreground">Registra cada modelo una sola vez. Después selecciónalo al ingresar inventario y completa únicamente SKU, cantidad y datos particulares.</p></div><button onClick={()=>setCreating(x=>!x)} className="rounded-md bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground">{creating?"Cerrar formulario":"Nuevo modelo"}</button></header><ProductsModuleNav/>
  {creating&&<SectionCard title="Registrar modelo maestro"><form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
    <Field label="Nombre comercial" value={form.name} onChange={v=>setForm(x=>({...x,name:v}))} required/>
    <Field label="Marca / fabricante" value={form.brand} onChange={v=>setForm(x=>({...x,brand:v}))} required/>
    <Field label="Modelo" value={form.model} onChange={v=>setForm(x=>({...x,model:v}))} required/>
    <Field label="Tipo de equipo" value={form.equipmentType} onChange={v=>setForm(x=>({...x,equipmentType:v}))}/>
    <Field label="Uso previsto" value={form.usage} onChange={v=>setForm(x=>({...x,usage:v}))}/>
    <label className="space-y-1 text-sm font-semibold"><span>Control de inventario</span><select value={form.trackingMode} onChange={e=>setForm(x=>({...x,trackingMode:e.target.value as "quantity"|"individual"}))} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm font-normal"><option value="quantity">Por cantidad / SKU</option><option value="individual">Unidad individual / número de serie</option></select></label>
    <Field label="Precio de venta de referencia" type="number" value={form.referenceSalePrice} onChange={v=>setForm(x=>({...x,referenceSalePrice:v}))}/>
    <label className="space-y-1 text-sm font-semibold"><span>Moneda</span><select value={form.currency} onChange={e=>setForm(x=>({...x,currency:e.target.value as "HNL"|"USD"|"EUR"}))} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm font-normal"><option>HNL</option><option>USD</option><option>EUR</option></select></label>
    <label className="space-y-1 text-sm font-semibold sm:col-span-2"><span>Descripción general</span><textarea value={form.description} onChange={e=>setForm(x=>({...x,description:e.target.value}))} rows={3} className="w-full rounded-md border border-input bg-background p-3 text-sm font-normal"/></label>
    <Field label="Imagen (URL opcional)" value={form.image} onChange={v=>setForm(x=>({...x,image:v}))}/>
    {error&&<p className="text-sm text-danger sm:col-span-2">{error}</p>}
    <div className="flex justify-end sm:col-span-2"><button disabled={saving} className="rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">{saving?"Guardando…":"Guardar modelo maestro"}</button></div>
  </form></SectionCard>}
  <SectionCard title="Modelos registrados"><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-muted/50 text-xs uppercase text-muted-foreground"><tr>{["Marca","Producto / modelo","Descripción","Control","Precio de referencia"].map(x=><th key={x} className="px-4 py-3">{x}</th>)}</tr></thead><tbody className="divide-y divide-border">{models.map(m=><tr key={m.id}><td className="px-4 py-3 font-semibold">{m.brand}</td><td className="px-4 py-3"><p className="font-semibold">{m.name}</p><p className="text-xs text-muted-foreground">{m.model}</p></td><td className="max-w-xs px-4 py-3 text-muted-foreground">{m.description}</td><td className="px-4 py-3">{m.trackingMode==="individual"?"Individual":"Por cantidad"}</td><td className="px-4 py-3 font-semibold">{new Intl.NumberFormat("es-HN",{style:"currency",currency:m.currency||"HNL"}).format(Number(m.referenceSalePrice)||0)}</td></tr>)}{!isLoading&&!models.length&&<tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Todavía no hay modelos maestros. Registra el primero para comenzar.</td></tr>}</tbody></table></div></SectionCard></div>;
}
function Field({label,value,onChange,type="text",required=false}:{label:string;value:string;onChange:(v:string)=>void;type?:string;required?:boolean}){return <label className="space-y-1 text-sm font-semibold"><span>{label}</span><input type={type} min={type==="number"?0:undefined} step={type==="number"?"0.01":undefined} required={required} value={value} onChange={e=>onChange(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm font-normal"/></label>}
