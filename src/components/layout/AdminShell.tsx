import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft, Boxes, ClipboardCheck, FileBarChart, LayoutDashboard, Menu,
  Package, Settings, ShieldCheck, Tag, Users, Warehouse, ShoppingCart,
  LogOut, ReceiptText, ChevronRight, FileText, Printer, ScanLine, X, Building2,
} from "lucide-react";
import { useAuth } from "@/lib/auth";

const administrativeNav = [
  { to: "/admin/ventas", label: "Ventas y carrito", icon: ReceiptText },
  { to: "/admin/bodega", label: "Bodega", icon: Warehouse },
  { to: "/admin/plan-compras", label: "Planificador de compras", icon: ShoppingCart },
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/usuarios", label: "Usuarios", icon: Users },
  { to: "/admin/configuracion", label: "Configuración", icon: Settings },
  { to: "/admin/reportes", label: "Reportes", icon: FileBarChart },
  { to: "/admin/cotizador", label: "Cotizador", icon: FileText },
  { to: "/admin/inventario", label: "Inventario", icon: Boxes },
  { to: "/admin/productos", label: "Catálogo de productos", icon: Package },
  { to: "/admin/categorias", label: "Categorías", icon: Tag },
  { to: "/admin/empresas", label: "Empresas", icon: Building2 },
] as const;

const teamNav = [
  { to: "/admin/equipos", label: "Equipos", icon: Boxes },
  { to: "/admin/inspecciones", label: "Inspecciones", icon: ClipboardCheck },
  { to: "/admin/reporte-inspecciones", label: "Imprimir reporte de inspección", icon: Printer },
  { to: "/scan", label: "Escáner de equipo", icon: ScanLine },
] as const;

const linkBase = "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors";
const activeLink = "bg-primary text-primary-foreground shadow-sm shadow-black/10";
const inactiveLink = "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground";

function NavList({ onNavigate, user }: { onNavigate?: () => void; user: ReturnType<typeof useAuth>["user"] }) {
  const isAdmin = user?.role === "magna" || user?.role === "administrador";
  const permissions = user?.permissions ?? [];
  const visibleAdmin = administrativeNav.filter(item => isAdmin || permissions.includes(({ "/admin/ventas":"sales", "/admin/bodega":"warehouse", "/admin/plan-compras":"purchases", "/admin":"reports", "/admin/usuarios":"users", "/admin/configuracion":"settings", "/admin/reportes":"reports", "/admin/cotizador":"quotes", "/admin/inventario":"inventory", "/admin/productos":"products", "/admin/categorias":"categories", "/admin/empresas":"companies" } as Record<string,string>)[item.to] ?? ""));
  const visibleTeam = teamNav.filter(item => isAdmin || permissions.includes(({ "/admin/equipos":"equipment", "/admin/inspecciones":"inspections", "/admin/reporte-inspecciones":"inspection_reports", "/scan":"scanner" } as Record<string,string>)[item.to] ?? ""));
  const renderLink = (item: (typeof administrativeNav)[number] | (typeof teamNav)[number]) => (
    <Link key={item.to} to={item.to} onClick={onNavigate}
      activeOptions={{ exact: "exact" in item ? item.exact : false }}
      activeProps={{ className: activeLink }} inactiveProps={{ className: inactiveLink }}
      className={linkBase}>
      <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="min-w-0 flex-1">{item.label}</span>
    </Link>
  );
  return (
    <nav aria-label="Navegación de administración" className="flex flex-col gap-1">
      <p className="mb-1 px-3 pt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-sidebar-foreground/50">Administrativo</p>
      {visibleAdmin.length > 0 && visibleAdmin.map(renderLink)}
      <div className="my-3 border-t border-sidebar-border" />
      <p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-sidebar-foreground/50">Gestión del equipo</p>
      {visibleTeam.map(renderLink)}
    </nav>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const closeMenu = () => setOpen(false);

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-[linear-gradient(115deg,rgba(249,115,22,0.055),transparent_42%)]">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r-4 border-primary/70 bg-sidebar px-3 py-4 text-sidebar-foreground lg:flex">
        <div className="mb-4 flex items-center gap-2.5 border-b border-sidebar-border px-2 pb-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm"><ShieldCheck className="h-5 w-5" aria-hidden="true" /></span>
          <span className="min-w-0"><span className="block truncate font-display text-sm font-extrabold">Administración</span><span className="mt-0.5 block truncate text-[11px] text-sidebar-foreground/60">{user?.role === "magna" ? "Acceso total · Magna" : user?.role === "administrador" ? "Administración" : "Gestión del equipo"}</span></span>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto pr-1"><NavList user={user} /></div>
        <div className="mt-3 border-t border-sidebar-border pt-3">
          <div className="mb-2 rounded-lg border border-primary/25 bg-primary/10 px-3 py-2"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">Sesión activa</p><p className="mt-1 truncate text-xs font-semibold text-sidebar-foreground">{user?.name ?? "Magna"}</p></div>
          <Link to="/" className="flex items-center gap-2 rounded-lg border border-sidebar-border px-3 py-2.5 text-sm font-semibold text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Volver a la aplicación</Link>
          <button type="button" onClick={logout} className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"><LogOut className="h-4 w-4" />Cerrar sesión</button>
        </div>
      </aside>

      {open && <><button type="button" aria-label="Cerrar menú" onClick={closeMenu} className="fixed inset-0 z-[110] bg-black/60 lg:hidden" /><aside id="admin-mobile-drawer" role="dialog" aria-modal="true" aria-label="Menú de administración" className="fixed inset-y-0 left-0 z-[120] flex h-dvh w-[86vw] max-w-xs flex-col overflow-hidden border-r-4 border-primary/70 bg-sidebar px-3 py-4 text-sidebar-foreground shadow-2xl lg:hidden">
        <div className="mb-4 flex items-center justify-between border-b border-sidebar-border px-2 pb-4"><div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary"/><span className="font-display text-sm font-extrabold">{user?.role === "magna" ? "Administración · Magna" : "Menú del sistema"}</span></div><button type="button" onClick={closeMenu} aria-label="Cerrar menú" className="grid h-9 w-9 place-items-center rounded-md hover:bg-sidebar-accent"><X className="h-5 w-5"/></button></div>
        <div className="min-h-0 flex-1 overflow-y-auto pr-1"><NavList user={user} onNavigate={closeMenu}/></div>
        <Link to="/" onClick={closeMenu} className="mt-3 flex shrink-0 items-center gap-2 rounded-lg border border-sidebar-border px-3 py-2.5 text-sm font-semibold"><ArrowLeft className="h-4 w-4"/>Volver a la aplicación</Link>
        <button type="button" onClick={logout} className="mt-2 flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-sidebar-foreground/70 hover:bg-sidebar-accent"><LogOut className="h-4 w-4"/>Cerrar sesión</button>
      </aside></>}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b-2 border-primary/55 bg-card/95 shadow-sm backdrop-blur">
          <div className="flex min-h-14 items-center gap-3 px-4 py-2 sm:px-6">
            <button type="button" onClick={() => setOpen(true)} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border lg:hidden" aria-label="Abrir menú de administración" aria-expanded={open} aria-controls="admin-mobile-drawer"><Menu className="h-5 w-5" /></button>
            <div className="flex min-w-0 items-center gap-2"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/12 text-primary"><ShieldCheck className="h-4 w-4" /></span><div className="min-w-0"><p className="truncate text-sm font-extrabold">Panel administrativo</p><p className="hidden text-[11px] text-muted-foreground sm:block">Bodega · Ventas · Compras · Gestión</p></div></div>
            <span className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-foreground sm:text-[11px]"><ShieldCheck className="h-3.5 w-3.5 text-primary" /> {user?.role === "magna" ? "Magna" : user?.role ?? "Usuario"}</span>
            <div className="hidden max-w-44 items-center gap-1 text-xs text-muted-foreground xl:flex"><span className="truncate">{user?.email}</span><ChevronRight className="h-3.5 w-3.5 shrink-0" /></div>
            <button type="button" onClick={logout} className="ml-1 hidden items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground sm:flex"><LogOut className="h-4 w-4" /><span className="hidden xl:inline">Salir</span></button>
          </div>
          <div className="flex items-center gap-2 bg-primary/[0.055] px-4 py-1.5 text-[11px] font-medium text-muted-foreground sm:px-6"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> {import.meta.env.DEV ? "Zona administrativa: los movimientos se registran en el modo local de desarrollo." : "Zona administrativa: los cambios se guardan en PostgreSQL."}</div>
        </header>
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-7">{children}</main>
      </div>
    </div>
  );
}
