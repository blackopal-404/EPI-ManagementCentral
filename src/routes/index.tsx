import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Boxes, CheckCircle2, ClipboardCheck, Plus, ScanLine, Warehouse, XCircle, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { dashboardService, equipmentService, inspectionService, userService } from "@/services";
import { MetricCard } from "@/components/common/MetricCard";
import { SectionCard } from "@/components/common/SectionCard";
import { InspectionResultBadge } from "@/components/common/StatusBadge";
import { getProductById } from "@/data/mock/products";

export const Route = createFileRoute("/")({ component: HomePage });

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-HN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${value}T12:00:00`));
}

function HomePage() {
  const metrics = useQuery({ queryKey: ["dashboard", "metrics"], queryFn: dashboardService.getMetrics });
  const equipment = useQuery({ queryKey: ["equipment", "recent"], queryFn: () => equipmentService.getEquipment() });
  const categories = useQuery({ queryKey: ["dashboard", "categories"], queryFn: dashboardService.getByCategory });
  const inspections = useQuery({ queryKey: ["inspections", "recent"], queryFn: inspectionService.getInspections });
  const users = useQuery({ queryKey: ["users"], queryFn: userService.getUsers });

  const recent = (equipment.data ?? []).slice(0, 4);
  const recentInspections = (inspections.data ?? []).slice(0, 5);
  const maxCategory = Math.max(...(categories.data ?? []).map((x) => x.total), 1);
  const total = metrics.data?.total ?? 0;
  const active = metrics.data?.active ?? 0;
  const expiring = metrics.data?.expiringSoon ?? 0;
  const expired = metrics.data?.expired ?? 0;
  const activePct = total ? Math.round((active / total) * 100) : 0;
  const expiringPct = total ? Math.round((expiring / total) * 100) : 0;
  const expiredPct = total ? Math.round((expired / total) * 100) : 0;

  return (
    <div className="space-y-5 sm:space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="label-caps">Panel de control</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">Bienvenido, Magna</h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">Aquí tienes un resumen del estado de tus equipos.</p>
        </div>
        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <span className="text-sm text-muted-foreground">{new Intl.DateTimeFormat("es-HN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date())}</span>
          <Link to="/admin/equipos" className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-sm transition hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Agregar equipo
          </Link>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Equipos registrados" value={total || "—"} icon={Boxes} />
        <MetricCard label="En buen estado" value={active || "—"} icon={CheckCircle2} tone="success" />
        <MetricCard label="Próximos a vencer" value={expiring || "—"} icon={AlertTriangle} tone="warning" />
        <MetricCard label="Vencidos" value={expired || "—"} icon={XCircle} tone="danger" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.05fr_1fr]">
        <SectionCard title="Estado de equipos" action={<Link to="/equipos" className="text-sm font-semibold text-primary">Ver todos</Link>}>
          <div className="grid gap-6 p-4 sm:grid-cols-[220px_1fr] sm:items-center sm:p-6">
            <div className="mx-auto grid h-48 w-48 place-items-center rounded-full sm:h-52 sm:w-52" style={{ background: `conic-gradient(var(--success) 0 ${activePct}%, var(--warning) ${activePct}% ${activePct + expiringPct}%, var(--danger) ${activePct + expiringPct}% 100%)` }}>
              <div className="grid h-28 w-28 place-items-center rounded-full bg-card text-center shadow-inner sm:h-32 sm:w-32">
                <div><div className="text-3xl font-extrabold">{total}</div><div className="text-xs text-muted-foreground">Equipos</div></div>
              </div>
            </div>
            <div className="space-y-4">
              {[
                ["En buen estado", active, activePct, "bg-success"],
                ["Próximos a vencer", expiring, expiringPct, "bg-warning"],
                ["Vencidos", expired, expiredPct, "bg-danger"],
              ].map(([label, value, pct, dot]) => (
                <div key={String(label)} className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
                  <span className={`h-3 w-3 rounded-full ${dot}`} />
                  <span className="text-sm font-medium">{String(label)}</span>
                  <span className="text-sm font-bold tabular-nums">{String(value)} <span className="font-normal text-muted-foreground">({String(pct)}%)</span></span>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Inspecciones recientes" action={<Link to="/inspecciones" className="text-sm font-semibold text-primary">Ver todas</Link>}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-sm">
              <thead className="bg-muted/70 text-left text-xs text-muted-foreground"><tr><th className="px-4 py-2.5 font-semibold">Fecha</th><th className="px-4 py-2.5 font-semibold">Código</th><th className="px-4 py-2.5 font-semibold">Equipo</th><th className="px-4 py-2.5 font-semibold">Estado</th><th className="px-4 py-2.5 font-semibold">Inspector</th></tr></thead>
              <tbody className="divide-y divide-border">
                {recentInspections.map((inspection) => {
                  const eq = equipment.data?.find((x) => x.id === inspection.equipmentId);
                  const product = eq ? getProductById(eq.productId) : undefined;
                  const inspector = users.data?.find((u) => u.id === inspection.inspectorId)?.fullName ?? "—";
                  return <tr key={inspection.id} className="hover:bg-muted/30"><td className="px-4 py-3 whitespace-nowrap">{formatDate(inspection.date)}</td><td className="px-4 py-3 mono-code text-xs">{eq?.internalCode ?? "—"}</td><td className="px-4 py-3 font-medium">{product?.name ?? "Equipo"}</td><td className="px-4 py-3"><InspectionResultBadge result={inspection.result} /></td><td className="px-4 py-3 whitespace-nowrap">{inspector}</td></tr>;
                })}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard title="Equipos por categoría" action={<Link to="/categorias" className="text-sm font-semibold text-primary">Ver más</Link>}>
          <div className="space-y-4 p-4 sm:p-5">
            {(categories.data ?? []).slice(0, 6).map((category, index) => <div key={category.name} className="grid grid-cols-[120px_1fr_32px] items-center gap-3 text-sm sm:grid-cols-[135px_1fr_38px]">
              <span className="truncate">{category.name}</span>
              <div className="h-2.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full" style={{ width: `${Math.max(8, (category.total / maxCategory) * 100)}%`, background: index === 0 ? "var(--primary)" : "var(--navy)" }} /></div>
              <span className="text-right font-semibold tabular-nums">{category.total}</span>
            </div>)}
          </div>
        </SectionCard>

        <SectionCard title="Últimos equipos agregados" action={<Link to="/equipos" className="text-sm font-semibold text-primary">Ver todos</Link>}>
          <div className="divide-y divide-border">
            {recent.map((e) => {
              const product = getProductById(e.productId);
              return <Link key={e.id} to="/equipos/unidad/$internalCode" params={{ internalCode: e.internalCode }} className="grid grid-cols-[56px_70px_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3.5 transition hover:bg-muted/30 sm:px-5">
                <div className="grid h-11 w-11 place-items-center overflow-hidden rounded-md bg-muted"><img src={product?.images.find((image) => image.isPrimary)?.url ?? product?.images[0]?.url ?? "/epp-harness.jpg"} alt="" className="h-full w-full object-contain" /></div>
                <span className="mono-code text-xs">{e.internalCode}</span>
                <span className="truncate text-sm font-semibold">{product?.name ?? "Equipo"}</span>
                <span className="hidden text-xs text-muted-foreground sm:block">{e.location}</span>
              </Link>;
            })}
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Link to="/scan" className="panel flex items-center gap-3 p-4 transition hover:-translate-y-0.5 hover:shadow-panel"><ScanLine className="h-5 w-5 text-primary" /><span><span className="block text-sm font-bold">Identificar equipo</span><span className="text-xs text-muted-foreground">Escanea un equipo</span></span><ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" /></Link>
        <Link to="/inventario" className="panel flex items-center gap-3 p-4 transition hover:-translate-y-0.5 hover:shadow-panel"><Warehouse className="h-5 w-5 text-primary" /><span><span className="block text-sm font-bold">Inventario de equipos</span><span className="text-xs text-muted-foreground">Consulta existencias</span></span><ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" /></Link>
        <Link to="/inspecciones" className="panel flex items-center gap-3 p-4 transition hover:-translate-y-0.5 hover:shadow-panel"><ClipboardCheck className="h-5 w-5 text-primary" /><span><span className="block text-sm font-bold">Revisar inspecciones</span><span className="text-xs text-muted-foreground">Controla próximas revisiones</span></span><ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" /></Link>
      </div>
    </div>
  );
}
