
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { inspectionService } from "@/services";
import { getUserName } from "@/data/mock/users";
import { EquipmentStatusBadge, InspectionResultBadge } from "@/components/common/StatusBadge";
import { getProductById } from "@/data/mock/products";
import { equipmentService } from "@/services";

export const Route = createFileRoute("/inspecciones")({ component: InspectionsPage });

function InspectionsPage() {
  const { data: inspections } = useQuery({ queryKey:["inspections"], queryFn: inspectionService.getInspections });
  const { data: equipment } = useQuery({ queryKey:["equipment"], queryFn:()=>equipmentService.getEquipment() });
  return <div className="space-y-5"><header><p className="label-caps">Control periódico</p><h1 className="mt-1 font-display text-2xl font-extrabold">Inspecciones</h1><p className="mt-1 text-sm text-muted-foreground">Registro mock de resultados y próximas fechas de inspección.</p></header><section className="panel overflow-hidden"><div className="divide-y divide-border">{(inspections??[]).map(i=>{const e=(equipment??[]).find(x=>x.id===i.equipmentId); const p=e&&getProductById(e.productId); return <article key={i.id} className="grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:p-5"><div><div className="flex flex-wrap items-center gap-2"><span className="mono-code text-xs">{e?.internalCode ?? i.equipmentId}</span><InspectionResultBadge result={i.result}/></div><h2 className="mt-1 font-semibold">{p?.name ?? "Equipo"}</h2><p className="mt-1 text-sm text-muted-foreground">{i.observations}</p><p className="mt-2 text-xs text-muted-foreground">Inspector: {getUserName(i.inspectorId)} · Próxima: {i.nextInspectionDate}</p></div><EquipmentStatusBadge status={e?.status ?? "activo"} size="sm"/></article>})}</div></section></div>;
}
