
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CalendarCheck, FileText, History, MapPin, UserRound, Wrench } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { equipmentService, inspectionService, productService, userService } from "@/services";
import { EquipmentStatusBadge, InspectionResultBadge } from "@/components/common/StatusBadge";
import { SectionCard } from "@/components/common/SectionCard";

export const Route = createFileRoute("/equipos/unidad/$internalCode")({ component: EquipmentDetailPage });

function EquipmentDetailPage() {
  const { internalCode } = Route.useParams();
  const eq = useQuery({ queryKey: ["equipment", internalCode], queryFn: () => equipmentService.getEquipmentByInternalCode(internalCode) });
  const item = eq.data;
  const products = useQuery({ queryKey: ["products"], queryFn: () => productService.getProducts() });
  const users = useQuery({ queryKey: ["users"], queryFn: userService.getUsers });
  const inspections = useQuery({ enabled: !!item, queryKey: ["inspections", item?.id], queryFn: () => inspectionService.getInspectionsByEquipment(item!.id) });
  const history = useQuery({ enabled: !!item, queryKey: ["history", item?.id], queryFn: () => equipmentService.getHistory(item!.id) });
  if (!item) return <div className="panel p-8 text-center"><h1 className="font-bold">Equipo no encontrado</h1><Link to="/equipos" className="mt-3 inline-block text-primary">Volver a equipos</Link></div>;
  const product = products.data?.find(p => p.id === item.productId);
  return <div className="space-y-5">
    <Link to="/equipos" className="inline-flex items-center gap-2 text-sm font-semibold text-primary"><ArrowLeft className="h-4 w-4" /> Equipos</Link>
    <section className="rounded-xl bg-navy p-5 text-navy-foreground sm:p-7"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="label-caps text-primary">Ficha individual</p><h1 className="mt-1 font-display text-3xl font-extrabold">{item.internalCode}</h1><p className="mt-1 text-sm text-navy-foreground/70">{product?.name} · Serie {item.serialNumber}</p></div><EquipmentStatusBadge status={item.status} /></div><div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><HeroInfo icon={MapPin} label="Ubicación" value={item.location} /><HeroInfo icon={UserRound} label="Responsable" value={users.data?.find(user => user.id === item.assignedUserId)?.fullName ?? "Sin asignar"} /><HeroInfo icon={CalendarCheck} label="Última inspección" value={item.lastInspectionDate ?? "Sin registro"} /><HeroInfo icon={CalendarCheck} label="Próxima inspección" value={item.nextInspectionDate ?? "Sin programar"} /></div></section>
    <div className="grid gap-5 lg:grid-cols-2">
      <SectionCard title="Identificación y fechas" description="Datos maestros de la unidad"><dl className="grid gap-3 p-5 sm:grid-cols-2">{[["Producto", product?.name],["Número de serie",item.serialNumber],["Data Matrix",item.dataMatrixCode ?? "No registrado"],["Fabricación",item.manufacturingDate],["Adquisición",item.purchaseDate],["Puesta en servicio",item.commissioningDate],["Vida útil",item.serviceLife],["Código de identificación",item.qrCode],["Notas",item.notes ?? "—"]].map(([l,v])=><div key={l}><dt className="label-caps">{l}</dt><dd className="mt-1 text-sm font-semibold">{v}</dd></div>)}</dl></SectionCard>
      <SectionCard title="Inspecciones" description="Historial de control de esta unidad"><div className="divide-y divide-border">{(inspections.data ?? []).map((i)=><div key={i.id} className="px-5 py-4"><div className="flex justify-between gap-3"><span className="text-sm font-semibold">{i.date}</span><InspectionResultBadge result={i.result} /></div><p className="mt-2 text-sm text-muted-foreground">{i.observations}</p></div>)}</div></SectionCard>
    </div>
    <SectionCard title="Historial de trazabilidad" description="Eventos registrados para esta unidad"><div className="divide-y divide-border">{(history.data ?? []).map((h)=><div key={h.id} className="grid grid-cols-[auto_1fr] gap-3 px-5 py-4"><div className="grid h-8 w-8 place-items-center rounded-full bg-accent text-primary">{h.type === "mantenimiento" ? <Wrench className="h-4 w-4"/> : h.type === "inspeccion" ? <CalendarCheck className="h-4 w-4"/> : <History className="h-4 w-4"/>}</div><div><p className="text-sm font-semibold">{h.title}</p><p className="mt-0.5 text-xs text-muted-foreground">{h.date} · {h.actor}</p><p className="mt-1 text-sm text-muted-foreground">{h.detail}</p></div></div>)}</div></SectionCard>
  </div>;
}
function HeroInfo({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) { return <div className="rounded-md border border-white/10 bg-white/5 p-3"><div className="flex items-center gap-2 text-navy-foreground/55"><Icon className="h-4 w-4"/><span className="label-caps">{label}</span></div><p className="mt-1 text-sm font-semibold">{value}</p></div>; }
