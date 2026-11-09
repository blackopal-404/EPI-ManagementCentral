import { createFileRoute, Link } from "@tanstack/react-router";
import { Boxes } from "lucide-react";

export const Route = createFileRoute("/admin/inventario")({ component: LegacyEquipmentInventory });

function LegacyEquipmentInventory() {
  return (
    <div className="panel space-y-3 p-6">
      <Boxes className="h-8 w-8 text-primary" />
      <h1 className="font-display text-2xl font-extrabold">Inventario de equipos</h1>
      <p className="text-sm text-muted-foreground">Esta vista se consolidó dentro de Gestión de equipos. El catálogo comercial y las existencias de bodega se administran en Productos.</p>
      <Link to="/inventario" className="inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Abrir inventario de equipos</Link>
    </div>
  );
}
