import { Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { BookOpen, Boxes, Tags } from "lucide-react";

const tabs = [
  { to: "/admin/productos", label: "Catálogo", icon: BookOpen },
  { to: "/admin/bodega", label: "Existencias", icon: Boxes },
  { to: "/admin/categorias", label: "Categorías", icon: Tags },
] as const;

export function ProductsModuleNav() {
  const { user } = useAuth();
  const isAdmin = user?.role === "magna" || user?.role === "administrador";
  const permissions = user?.permissions ?? [];
  const visibleTabs = tabs.filter(tab => isAdmin || permissions.includes(
    tab.to === "/admin/productos" ? "products" : tab.to === "/admin/bodega" ? "warehouse" : "categories"
  ));
  return (
    <nav aria-label="Secciones de productos" className="flex gap-2 overflow-x-auto border-b border-border pb-2">
      {visibleTabs.map(({ to, label, icon: Icon }) => (
        <Link key={to} to={to} activeProps={{ className: "bg-primary text-primary-foreground" }}
          inactiveProps={{ className: "bg-muted text-muted-foreground hover:text-foreground" }}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold">
          <Icon className="h-4 w-4" />{label}
        </Link>
      ))}
    </nav>
  );
}
