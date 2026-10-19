
import { Link } from "@tanstack/react-router";
import { Edit3, MapPin, Trash2, UserRound } from "lucide-react";
import type { Equipment } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { productService, userService } from "@/services";
import { EquipmentStatusBadge } from "@/components/common/StatusBadge";

export function EquipmentTable({ equipment, onEdit, onDelete }: { equipment: Equipment[]; onEdit?: (equipment: Equipment) => void; onDelete?: (id: string) => void }) {
  const { data: products = [] } = useQuery({ queryKey: ["products"], queryFn: () => productService.getProducts() });
  const { data: users = [] } = useQuery({ queryKey: ["users"], queryFn: userService.getUsers });
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-semibold">Equipo</th>
            <th className="px-4 py-3 font-semibold">Producto</th>
            <th className="px-4 py-3 font-semibold">Estado</th>
            <th className="px-4 py-3 font-semibold">Ubicación</th>
            <th className="px-4 py-3 font-semibold">Responsable</th>
            <th className="px-4 py-3 font-semibold">Próxima inspección</th>
            {(onEdit || onDelete) && <th className="px-4 py-3 font-semibold">Acciones</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {equipment.map((item) => {
            const product = products.find(p => p.id === item.productId);
            return (
              <tr key={item.id} className="hover:bg-muted/30">
                <td className="px-4 py-3">
                  <Link to="/equipos/unidad/$internalCode" params={{ internalCode: item.internalCode }} className="font-semibold text-primary hover:underline">
                    {item.internalCode}
                  </Link>
                  <p className="mono-code mt-0.5 text-[11px] text-muted-foreground">Serie: {item.serialNumber}</p>
                  {item.dataMatrixCode && <p className="mono-code mt-0.5 text-[10px] text-muted-foreground">Data Matrix: {item.dataMatrixCode}</p>}
                </td>
                <td className="px-4 py-3">{product?.name ?? "Producto no encontrado"}</td>
                <td className="px-4 py-3"><EquipmentStatusBadge status={item.status} size="sm" /></td>
                <td className="px-4 py-3"><span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-muted-foreground" />{item.location}</span></td>
                <td className="px-4 py-3"><span className="inline-flex items-center gap-1.5"><UserRound className="h-3.5 w-3.5 text-muted-foreground" />{users.find(user => user.id === item.assignedUserId)?.fullName ?? "Sin asignar"}</span></td>
                <td className="px-4 py-3">{item.nextInspectionDate ?? "—"}</td>
                {(onEdit || onDelete) && <td className="px-4 py-3"><div className="flex gap-2">{onEdit && <button onClick={() => onEdit(item)} className="rounded-md border border-border p-2 hover:bg-muted" aria-label="Editar"><Edit3 className="h-4 w-4" /></button>}{onDelete && <button onClick={() => onDelete(item.id)} className="rounded-md border border-danger/20 p-2 text-danger hover:bg-danger-soft" aria-label="Eliminar"><Trash2 className="h-4 w-4" /></button>}</div></td>}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
