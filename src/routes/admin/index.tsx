import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/services";
import { MetricCard } from "@/components/common/MetricCard";
import { Boxes, ClipboardCheck, Package, Users, Warehouse, ArrowRight, ShoppingCart, FileText, Settings, FileBarChart, ReceiptText, Building2 } from "lucide-react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/admin/")({ component: AdminDashboard });

function AdminDashboard() {
  const { user } = useAuth();
  const { data } = useQuery({ queryKey: ["admin-metrics"], queryFn: dashboardService.getMetrics });
  const links = [
    ...((user?.role === "magna" || user?.role === "administrador") ? [["Ventas y carrito", "/admin/ventas", ReceiptText] as const, ["Bodega", "/admin/bodega", Warehouse] as const, ["Planificador de compras", "/admin/plan-compras", ShoppingCart] as const, ["Cotizador", "/admin/cotizador", FileText] as const, ["Inventario", "/admin/inventario", Boxes] as const, ["Reportes", "/admin/reportes", FileBarChart] as const, ["Configuración", "/admin/configuracion", Settings] as const, ["Empresas", "/admin/empresas", Building2] as const] : []),
    ["Catálogo de productos", "/admin/productos", Package] as const,
    ["Equipos", "/admin/equipos", Boxes] as const,
    ["Inspecciones", "/admin/inspecciones", ClipboardCheck] as const,
    ["Reporte de inspecciones", "/admin/reporte-inspecciones", FileBarChart] as const,
    ["Usuarios", "/admin/usuarios", Users] as const,
  ];
  return <div className="space-y-6"><header><p className="label-caps">Área administrativa</p><h1 className="mt-1 font-display text-2xl font-extrabold">Dashboard</h1><p className="mt-1 text-sm text-muted-foreground">Vista operativa de la gestión de equipos.</p></header><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><MetricCard label="Equipos" value={data?.total??"—"} icon={Boxes}/><MetricCard label="Activos" value={data?.active??"—"} icon={ClipboardCheck} tone="success"/><MetricCard label="Próximos a vencer" value={data?.expiringSoon??"—"} icon={Warehouse} tone="warning"/><MetricCard label="Fuera de servicio" value={data?.outOfService??"—"} icon={Package} tone="danger"/></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{links.map(([label,to,Icon])=><Link key={to} to={to} className="panel flex items-center justify-between p-4 hover:shadow-panel"><span className="flex items-center gap-3"><Icon className="h-5 w-5 text-primary"/><span className="font-semibold">{label}</span></span><ArrowRight className="h-4 w-4 text-muted-foreground"/></Link>)}</div></div>;
}
