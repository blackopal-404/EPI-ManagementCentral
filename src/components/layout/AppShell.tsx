import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  ClipboardCheck, FileBarChart, LayoutDashboard, Menu, Package, ScanLine,
  Search, Settings, Tag, LogOut, FileText, Warehouse, ShoppingCart, Users,
  ReceiptText, Printer, Boxes, X,
} from "lucide-react";
import { GlobalSearch, SearchTrigger } from "./GlobalSearch";
import { useAuth } from "@/lib/auth";

const teamNav = [
  { to: "/equipos", label: "Equipos", icon: Package },
  { to: "/inspecciones", label: "Inspecciones", icon: ClipboardCheck },
  { to: "/reporte-inspecciones", label: "Imprimir reporte de inspección", icon: Printer },
  { to: "/scan", label: "Escáner de equipo", icon: ScanLine },
] as const;

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
] as const;

const linkBase = "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors";

function NavLinks({ onNavigate, isMagna }: { onNavigate?: () => void; isMagna: boolean }) {
  const renderLink = (item: (typeof teamNav)[number] | (typeof administrativeNav)[number]) => (
    <Link key={item.to} to={item.to} onClick={onNavigate}
      activeOptions={{ exact: "exact" in item ? item.exact : false }}
      activeProps={{ className: "bg-primary text-primary-foreground shadow-sm" }}
      inactiveProps={{ className: "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground" }}
      className={linkBase}>
      <item.icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
      <span className="min-w-0 flex-1">{item.label}</span>
    </Link>
  );
  return <nav aria-label="Navegación principal" className="space-y-1">
    {isMagna && <>
      <p className="mb-1 px-3 pt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-sidebar-foreground/50">Administrativo</p>
      {administrativeNav.map(renderLink)}
      <div className="my-3 border-t border-sidebar-border" />
    </>}
    <p className="mb-1 px-3 pt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-sidebar-foreground/50">Gestión del equipo</p>
    {teamNav.map(renderLink)}
  </nav>;
}

export function AppShell({ children }: { children: ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const isMagna = user?.role === "magna";
  const initials = (user?.name ?? "Magna").split(" ").map((x) => x[0]).slice(0, 2).join("").toUpperCase();
  const closeMenu = () => setMenuOpen(false);

  return <div className="min-h-screen bg-background text-foreground">
    <a href="#contenido" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-card focus:px-3 focus:py-2">Saltar al contenido</a>
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col overflow-hidden border-r border-sidebar-border bg-gradient-to-b from-sidebar via-sidebar to-sidebar text-sidebar-foreground lg:flex">
        <div className="relative z-10 flex min-h-0 flex-1 flex-col">
          <div className="border-b border-white/15 px-5 py-5"><Link to="/" className="block"><img src="/vertical-safety-logo.png" alt="Vertical Safety" className="h-auto w-full max-w-[205px] object-contain object-left brightness-110" /><p className="mt-2 text-[9px] font-semibold uppercase tracking-[0.14em] text-white/65">EPIControl · Gestión de EPI</p></Link></div>
          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-5"><NavLinks isMagna={isMagna} /></div>
          <div className="border-t border-white/15 px-4 py-4"><div className="rounded-xl border border-white/10 bg-white/5 p-3"><p className="text-xs font-bold tracking-wide text-white/90">ALTURA · SEGURIDAD · CONFIANZA</p><div className="mt-3 h-1 w-12 rounded-full bg-primary" /><p className="mt-3 text-[11px] leading-5 text-white/65">Trabajamos por un mundo más seguro.</p></div><button type="button" onClick={logout} className="mt-3 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-white/65 hover:bg-white/10 hover:text-white"><LogOut className="h-4 w-4" />Cerrar sesión</button></div>
        </div>
      </aside>

      {menuOpen && <><button type="button" aria-label="Cerrar menú" onClick={closeMenu} className="fixed inset-0 z-[110] bg-black/60 lg:hidden" /><aside id="app-mobile-drawer" role="dialog" aria-modal="true" aria-label="Menú principal" className="fixed inset-y-0 left-0 z-[120] flex h-dvh w-[86vw] max-w-xs flex-col overflow-hidden bg-sidebar text-sidebar-foreground shadow-2xl lg:hidden">
        <div className="flex shrink-0 items-center justify-between border-b border-white/15 px-4 py-4"><div className="min-w-0"><img src="/vertical-safety-logo.png" alt="Vertical Safety" className="w-full max-w-[200px] brightness-110"/><p className="mt-2 text-[9px] font-semibold uppercase tracking-[0.14em] text-white/65">EPIControl · Gestión de EPI</p></div><button type="button" onClick={closeMenu} aria-label="Cerrar menú" className="ml-2 grid h-9 w-9 shrink-0 place-items-center rounded-md hover:bg-sidebar-accent"><X className="h-5 w-5"/></button></div>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4"><NavLinks onNavigate={closeMenu} isMagna={isMagna}/></div>
        <div className="shrink-0 border-t border-white/15 p-4"><p className="truncate text-xs font-semibold">{user?.name ?? "Usuario"}</p><p className="mt-1 text-[11px] text-white/60">{isMagna ? "Magna" : "Gestión del equipo"}</p><button type="button" onClick={logout} className="mt-3 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-white/70 hover:bg-white/10"><LogOut className="h-4 w-4"/>Cerrar sesión</button></div>
      </aside></>}

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur"><div className="mx-auto flex h-16 max-w-[1500px] items-center gap-3 px-4 sm:px-6">
          <button type="button" onClick={() => setMenuOpen(true)} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-border lg:hidden" aria-label="Abrir menú" aria-expanded={menuOpen} aria-controls="app-mobile-drawer"><Menu className="h-5 w-5" /></button>
          <div className="hidden shrink-0 lg:block"><Link to="/"><img src="/vertical-safety-logo.png" alt="Vertical Safety" className="h-11 w-[205px] object-contain object-left" /></Link></div>
          <div className="hidden min-w-0 flex-1 md:block"><SearchTrigger onClick={() => setSearchOpen(true)} /></div>
          <div className="ml-auto flex items-center gap-2"><Link to="/scan" className="hidden h-10 w-10 place-items-center rounded-lg border border-border text-muted-foreground hover:bg-muted sm:grid" aria-label="Escanear equipo"><ScanLine className="h-5 w-5" /></Link>{isMagna && <Link to="/admin" className="hidden h-10 items-center gap-2 rounded-lg border border-primary/40 bg-primary/5 px-3 text-sm font-semibold hover:bg-primary/10 md:inline-flex"><Settings className="h-4 w-4" />Administración</Link>}<div className="hidden h-10 w-10 place-items-center rounded-full bg-sidebar text-xs font-bold text-sidebar-foreground sm:grid">{initials}</div><div className="hidden min-w-0 md:block"><p className="max-w-36 truncate text-sm font-bold">{user?.name ?? "Usuario"}</p><p className="text-[11px] text-muted-foreground">{isMagna ? "Magna" : "Usuario"}</p></div><button type="button" onClick={() => setSearchOpen(true)} className="grid h-10 w-10 place-items-center rounded-lg border border-border md:hidden" aria-label="Buscar"><Search className="h-5 w-5" /></button></div>
        </div></header>
        <main id="contenido" className="mx-auto w-full max-w-[1500px] flex-1 px-4 py-5 pb-24 sm:px-6 sm:py-7 lg:pb-8">{children}</main>
        <footer className="hidden border-t border-border bg-card py-5 lg:block"><div className="mx-auto flex max-w-[1500px] justify-between px-6 text-xs text-muted-foreground"><span>© {new Date().getFullYear()} Vertical Safety. Todos los derechos reservados.</span><span>Honduras · VerticalAccess · Professional Rescue</span></div></footer>
      </div>
    </div>
    <nav aria-label="Navegación móvil" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-border bg-card/95 backdrop-blur lg:hidden">
      <MobileTab to="/equipos" label="Equipos" icon={Package} />
      <MobileTab to="/inspecciones" label="Inspecciones" icon={ClipboardCheck} />
      <Link to="/scan" className="relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold text-primary"><span className="absolute -top-5 grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg"><ScanLine className="h-6 w-6" /></span><span className="mt-5">Escanear</span></Link>
      <MobileTab to="/reporte-inspecciones" label="Reporte" icon={Printer} />
    </nav>
    <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
  </div>;
}

function MobileTab({ to, label, icon: Icon }: { to: "/equipos" | "/inspecciones" | "/reporte-inspecciones"; label: string; icon: typeof ScanLine }) {
  return <Link to={to} activeProps={{ className: "text-primary" }} inactiveProps={{ className: "text-muted-foreground" }} className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium"><Icon className="h-5 w-5" />{label}</Link>;
}
