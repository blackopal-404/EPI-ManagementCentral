
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, ScanLine, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { equipmentService } from "@/services";
import { SectionCard } from "@/components/common/SectionCard";
import { EquipmentTable } from "@/components/equipment/EquipmentTable";
import { equipmentStatusMeta } from "@/components/common/StatusBadge";

export const Route = createFileRoute("/equipos/")({ component: EquipmentPage });

function EquipmentPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const query = useQuery({ queryKey: ["equipment", search, status], queryFn: () => equipmentService.getEquipment({ search, status }) });
  const count = query.data?.length ?? 0;

  return (
    <div className="space-y-5">
      <header>
        <p className="label-caps">Trazabilidad individual</p>
        <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div><h1 className="font-display text-2xl font-extrabold">Equipos</h1><p className="mt-1 text-sm text-muted-foreground">Consulta cada unidad física por código interno, serie, estado o ubicación.</p></div>
          <Link to="/scan" className="inline-flex w-fit items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-bold text-primary-foreground"><ScanLine className="h-4 w-4" /> Identificar equipo</Link>
        </div>
      </header>
      <SectionCard title={`${count} unidades`} description="Datos simulados de la primera versión">
        <div className="grid gap-2 border-b border-border p-4 md:grid-cols-[1fr_220px]">
          <div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar código, serie, Data Matrix o ubicación…" className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring" /></div>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring">
            <option value="">Todos los estados</option>
            {Object.entries(equipmentStatusMeta).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}
          </select>
        </div>
        {query.isLoading ? <div className="p-8 text-center text-sm text-muted-foreground">Cargando equipos…</div> : <EquipmentTable equipment={query.data ?? []} />}
      </SectionCard>
    </div>
  );
}
