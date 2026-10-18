import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ClipboardCheck, FileBarChart, LayoutDashboard, Menu, Package, ScanLine, Search, Settings, Tag, LogOut, FileText, Warehouse, ShoppingCart } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { GlobalSearch, SearchTrigger } from "./GlobalSearch";
import { useAuth } from "@/lib/auth";

const nav = [
  { to: "/", label: "Inicio", icon: LayoutDashboard, exact: true },
  { to: "/equipos", label: "Equipos", icon: Package },
  { to: "/inspecciones", label: "Inspecciones", icon: ClipboardCheck },
  { to: "/reportes", label: "Reportes", icon: FileBarChart },
  { to: "/scan", label: "Escanear equipo", icon: ScanLine },
  { to: "/cotizaciones", label: "Cotizaciones", icon: FileText },
  { to: "/inventario", label: "Inventario", icon: Warehouse },
  { to: "/productos", label: "Productos", icon: Package },
  { to: "/categorias", label: "Categorías", icon: Tag },
] as const;

type AppRoute = (typeof nav)[number]["to"];

function NavLinks({ onNavigate, isMagna }: { onNavigate?: () => void; isMagna: boolean }) {
  return <nav aria-label="Navegación principal" className="space-y-1">
    {nav.filter((item) => item.to !== "/reportes" || isMagna).map((item) => <Link key={item.to} to={item.to} onClick={onNavigate} activeOptions={{ exact: "exact" in item ? item.exact : false }} activeProps={{ className: "bg-primary text-primary-foreground shadow-sm" }} inactiveProps={{ className: "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground" }} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors">
      <item.icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />{item.label}
    </Link>)}
    {isMagna && <>
      <div className="my-3 border-t border-sidebar-border" />
      <Link to="/admin/bodega" onClick={onNavigate} activeProps={{ className: "bg-primary text-primary-foreground" }} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-sidebar-foreground/80 hover:bg-sidebar-accent"><Warehouse className="h-[18px] w-[18px]" />Bodega</Link>
      <Link to="/admin/plan-compras" onClick={onNavigate} activeProps={{ className: "bg-primary text-primary-foreground" }} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-sidebar-foreground/80 hover:bg-sidebar-accent"><ShoppingCart className="h-[18px] w-[18px]" />Planificador de compras <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">Magna</span></Link>
    </>}
  </nav>;
}

export function AppShell({ children }: { children: ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const initials = (user?.name ?? "Magna").split(" ").map((x) => x[0]).slice(0, 2).join("").toUpperCase();

  return <div className="min-h-screen bg-background text-foreground">
    <a href="#contenido" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-card focus:px-3 focus:py-2">Saltar al contenido</a>
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col overflow-hidden bg-gradient-to-b from-sidebar via-sidebar to-sidebar text-sidebar-foreground lg:flex">
        <div className="relative z-10 flex min-h-0 flex-1 flex-col">
          <div className="border-b border-white/15 px-5 py-5">
            <Link to="/" className="block">
              <img src="/vertical-safety-logo.png" alt="Vertical Safety" className="h-auto w-full max-w-[205px] object-contain object-left brightness-110" />
              <p className="mt-2 text-[9px] font-semibold uppercase tracking-[0.14em] text-white/65">EPIControl · Gestión de EPI</p>
            </Link>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-5"><NavLinks isMagna={user?.role === "magna"} /></div>
          <div className="border-t border-white/15 px-4 py-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-3"><p className="text-xs font-bold tracking-wide text-white/90">ALTURA · SEGURIDAD · CONFIANZA</p><div className="mt-3 h-1 w-12 rounded-full bg-primary" /><p className="mt-3 text-[11px] leading-5 text-white/65">Trabajamos por un mundo más seguro.</p></div>
            <button type="button" onClick={logout} className="mt-3 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-white/65 hover:bg-white/10 hover:text-white"><LogOut className="h-4 w-4" />Cerrar sesión</button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-[1500px] items-center gap-3 px-4 sm:px-6">
            <div className="hidden shrink-0 lg:block"><Link to="/"><img src="/vertical-safety-logo.png" alt="Vertical Safety" className="h-11 w-[205px] object-contain object-left" /></Link></div>
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}><SheetTrigger className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-border lg:hidden" aria-label="Abrir menú"><Menu className="h-5 w-5" /></SheetTrigger><SheetContent side="left" className="z-[100] flex h-dvh max-h-dvh w-[85vw] max-w-xs flex-col overflow-hidden bg-gradient-to-b from-sidebar via-sidebar to-sidebar p-0 text-sidebar-foreground shadow-2xl">
              <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-5">
                <SheetHeader className="mb-5"><SheetTitle className="text-left text-white">EPIControl</SheetTitle></SheetHeader>
                <img src="/vertical-safety-logo.png" alt="Vertical Safety" className="mb-5 w-full max-w-[210px] brightness-110" />
                <NavLinks onNavigate={() => setMenuOpen(false)} isMagna={user?.role === "magna"} />
                <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-3"><p className="text-xs font-bold tracking-wide text-white/90">ALTURA · SEGURIDAD · CONFIANZA</p><div className="mt-3 h-1 w-12 rounded-full bg-primary" /><p className="mt-3 text-[11px] leading-5 text-white/65">Trabajamos por un mundo más seguro.</p></div>
              </div>
            </SheetContent></Sheet>
            <Link to="/" className="shrink-0 lg:hidden"><img src="/vertical-safety-logo.png" alt="Vertical Safety" className="h-9 w-auto max-w-[150px] object-contain" /></Link>
            <div className="hidden min-w-0 flex-1 md:block"><SearchTrigger onClick={() => setSearchOpen(true)} /></div>
            <div className="ml-auto flex items-center gap-2">
              <Link to="/scan" className="hidden h-10 w-10 place-items-center rounded-lg border border-border text-muted-foreground hover:bg-muted sm:grid" aria-label="Escanear equipo"><ScanLine className="h-5 w-5" /></Link>
              {user?.role === "magna" && <Link to="/admin" className="hidden h-10 items-center gap-2 rounded-lg border border-primary/40 bg-primary/5 px-3 text-sm font-semibold hover:bg-primary/10 md:inline-flex"><Settings className="h-4 w-4" />Administración</Link>}
              <div className="hidden h-10 w-10 place-items-center rounded-full bg-sidebar text-xs font-bold text-sidebar-foreground sm:grid">{initials}</div>
              <div className="hidden min-w-0 md:block"><p className="max-w-36 truncate text-sm font-bold">{user?.name ?? "Usuario"}</p><p className="text-[11px] text-muted-foreground">{user?.role === "magna" ? "Magna" : "Usuario"}</p></div>
              <button type="button" onClick={() => setSearchOpen(true)} className="grid h-10 w-10 place-items-center rounded-lg border border-border md:hidden" aria-label="Buscar"><Search className="h-5 w-5" /></button>
            </div>
          </div>
        </header>
        <main id="contenido" className="mx-auto w-full max-w-[1500px] flex-1 px-4 py-5 pb-24 sm:px-6 sm:py-7 lg:pb-8">{children}</main>
        <footer className="hidden border-t border-border bg-card py-5 lg:block"><div className="mx-auto flex max-w-[1500px] justify-between px-6 text-xs text-muted-foreground"><span>© {new Date().getFullYear()} Vertical Safety. Todos los derechos reservados.</span><span>Honduras · VerticalAccess · Professional Rescue</span></div></footer>
      </div>
    </div>
    <nav aria-label="Navegación móvil" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-card/95 backdrop-blur lg:hidden">
      <MobileTab to="/" label="Inicio" icon={LayoutDashboard} exact />
      <MobileTab to="/equipos" label="Equipos" icon={Package} />
      <Link to="/scan" className="relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold text-primary"><span className="absolute -top-5 grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg"><ScanLine className="h-6 w-6" /></span><span className="mt-5">Escanear</span></Link>
      <MobileTab to="/inspecciones" label="Revisiones" icon={ClipboardCheck} />
      <MobileTab to="/inventario" label="Inventario" icon={Warehouse} />
    </nav>
    <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
  </div>;
}

function MobileTab({ to, label, icon: Icon, exact }: { to: AppRoute; label: string; icon: typeof ScanLine; exact?: boolean }) {
  return <Link to={to} activeOptions={{ exact: exact ?? false }} activeProps={{ className: "text-primary" }} inactiveProps={{ className: "text-muted-foreground" }} className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium"><Icon className="h-5 w-5" />{label}</Link>;
}
