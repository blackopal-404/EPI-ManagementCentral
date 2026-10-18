
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { inspectionService } from "@/services";
import { SectionCard } from "@/components/common/SectionCard";
import { InspectionResultBadge } from "@/components/common/StatusBadge";

export const Route=createFileRoute("/admin/inspecciones")({component:AdminInspections});
function AdminInspections(){const{data}=useQuery({queryKey:["admin-inspections"],queryFn:inspectionService.getInspections});return <div className="space-y-5"><header><p className="label-caps">Administración</p><h1 className="mt-1 font-display text-2xl font-extrabold">Inspecciones</h1></header><SectionCard title="Registros"><div className="divide-y divide-border">{(data??[]).map(i=><div key={i.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="mono-code text-xs">{i.equipmentId}</p><p className="mt-1 text-sm font-semibold">{i.date} · {i.nextInspectionDate}</p><p className="mt-1 text-sm text-muted-foreground">{i.observations}</p></div><InspectionResultBadge result={i.result}/></div>)}</div></SectionCard></div>}
