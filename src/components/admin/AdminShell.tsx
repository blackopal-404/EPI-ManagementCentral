import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft, Boxes, ClipboardCheck, FileBarChart, LayoutDashboard, Menu,
  Package, Settings, ShieldCheck, Tag, Users, Warehouse, ShoppingCart,
  LogOut, ReceiptText, ChevronRight,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth";

const adminNav = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/productos", label: "Productos", icon: Package },
  { to: "/admin/equipos", label: "Equipos", icon: Boxes },
  { to: "/admin/categorias", label: "Categorías", icon: Tag },
  { to: "/admin/inspecciones", label: "Inspecciones", icon: ClipboardCheck },
  { to: "/admin/usuarios", label: "Usuarios", icon: Users },
  { to: "/admin/reportes", label: "Reportes", icon: FileBarChart },
  { to: "/admin/configuracion", label: "Configuración", icon: Settings },
] as const;

const linkBase = "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors";
const activeLink = "bg-primary text-primary-foreground shadow-sm shadow-black/10";
const inactiveLink = "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground";

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav aria-label="Navegación de administración" className="flex flex-col gap-1">
      <p className="mb-1 px-3 pt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-sidebar-foreground/45">Operaciones</p>
      <Link to="/admin/ventas" onClick={onNavigate} activeProps={{ className: activeLink }} inactiveProps={{ className: inactiveLink }} className={linkBase}>
        <ReceiptText className="h-4 w-4 shrink-0" /> Ventas y carrito
      </Link>
      <Link to="/admin/bodega" onClick={onNavigate} activeProps={{ className: activeLink }} inactiveProps={{ className: inactiveLink }} className={linkBase}>
        <Warehouse className="h-4 w-4 shrink-0" /> Bodega
      </Link>
      <Link to="/admin/plan-compras" onClick={onNavigate} activeProps={{ className: activeLink }} inactiveProps={{ className: inactiveLink }} className={linkBase}>
        <ShoppingCart className="h-4 w-4 shrink-0" /> Planificador de compras
      </Link>
      <div className="my-3 border-t border-sidebar-border" />
      <p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-sidebar-foreground/45">Gestión del sistema</p>
      {adminNav.map((item) => (
        <Link key={item.to} to={item.to} onClick={onNavigate}
          activeOptions={{ exact: "exact" in item ? item.exact : false }}
          activeProps={{ className: activeLink }} inactiveProps={{ className: inactiveLink }}
          className={linkBase}>
          <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />{item.label}
        </Link>
      ))}
    </nav>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-[linear-gradient(115deg,rgba(249,115,22,0.055),transparent_42%)]">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r-4 border-primary/70 bg-sidebar px-3 py-4 text-sidebar-foreground lg:flex">
        <div className="mb-4 flex items-center gap-2.5 border-b border-sidebar-border px-2 pb-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-display text-sm font-extrabold">Administración</span>
            <span className="mt-0.5 block truncate text-[11px] text-sidebar-foreground/60">Área exclusiva de Magna</span>
          </span>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto"><NavList /></div>
        <div className="mt-3 border-t border-sidebar-border pt-3">
          <div className="mb-2 rounded-lg border border-primary/25 bg-primary/10 px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">Sesión activa</p>
            <p className="mt-1 truncate text-xs font-semibold text-sidebar-foreground">{user?.name ?? "Magna"}</p>
          </div>
          <Link to="/" className="flex items-center gap-2 rounded-lg border border-sidebar-border px-3 py-2.5 text-sm font-semibold text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Volver a la aplicación
          </Link>
          <button type="button" onClick={logout} className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"><LogOut className="h-4 w-4" />Cerrar sesión</button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b-2 border-primary/55 bg-card/95 shadow-sm backdrop-blur">
          <div className="flex min-h-14 items-center gap-3 px-4 py-2 sm:px-6">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border lg:hidden" aria-label="Abrir menú de administración"><Menu className="h-5 w-5" /></SheetTrigger>
              <SheetContent side="left" className="z-[100] flex h-dvh max-h-dvh w-[86vw] max-w-xs flex-col overflow-hidden border-r-4 border-primary/70 bg-sidebar text-sidebar-foreground">
                <SheetHeader className="mb-4"><SheetTitle className="flex items-center gap-2 text-left text-sidebar-foreground"><ShieldCheck className="h-5 w-5 text-primary" /> Administración · Magna</SheetTitle></SheetHeader>
                <div className="min-h-0 flex-1 overflow-y-auto px-1 pb-6"><NavList onNavigate={() => setOpen(false)} /></div>
                <div className="shrink-0 border-t border-sidebar-border bg-sidebar px-1 pt-3"><Link to="/" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg border border-sidebar-border px-3 py-2.5 text-sm font-semibold"><ArrowLeft className="h-4 w-4" />Volver a la aplicación</Link></div>
              </SheetContent>
            </Sheet>
            <div className="flex min-w-0 items-center gap-2">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/12 text-primary"><ShieldCheck className="h-4 w-4" /></span>
              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold">Panel administrativo</p>
                <p className="hidden text-[11px] text-muted-foreground sm:block">Bodega · Ventas · Compras · Gestión</p>
              </div>
            </div>
            <span className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-foreground sm:text-[11px]"><ShieldCheck className="h-3.5 w-3.5 text-primary" /> Magna</span>
            <div className="hidden max-w-44 items-center gap-1 text-xs text-muted-foreground xl:flex"><span className="truncate">{user?.email}</span><ChevronRight className="h-3.5 w-3.5 shrink-0" /></div>
            <button type="button" onClick={logout} className="ml-1 hidden items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground sm:flex"><LogOut className="h-4 w-4" /><span className="hidden xl:inline">Salir</span></button>
          </div>
          <div className="flex items-center gap-2 bg-primary/[0.055] px-4 py-1.5 text-[11px] font-medium text-muted-foreground sm:px-6">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" /> {import.meta.env.DEV ? "Zona administrativa: los movimientos se registran en modo local de desarrollo." : "Zona administrativa: los cambios se guardan en PostgreSQL."}
          </div>
        </header>
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-7">{children}</main>
      </div>
    </div>
  );
}
