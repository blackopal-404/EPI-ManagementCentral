import type { EquipmentStatus, InspectionResult, ProductStatus } from "@/types";
import { cn } from "@/lib/utils";

type Tone = "success" | "warning" | "danger" | "neutral" | "info";

const toneClasses: Record<Tone, string> = {
  success: "bg-success-soft text-success border-success/30",
  warning: "bg-warning-soft text-warning-foreground border-warning/40",
  danger: "bg-danger-soft text-danger border-danger/30",
  neutral: "bg-neutral-soft text-muted-foreground border-border",
  info: "bg-accent text-accent-foreground border-primary/25",
};

export const equipmentStatusMeta: Record<EquipmentStatus, { label: string; tone: Tone }> = {
  activo: { label: "Activo", tone: "success" },
  disponible: { label: "Disponible", tone: "success" },
  asignado: { label: "Asignado", tone: "info" },
  en_inspeccion: { label: "En inspección", tone: "warning" },
  mantenimiento: { label: "Mantenimiento", tone: "warning" },
  proximo_vencer: { label: "Próximo a vencer", tone: "warning" },
  vencido: { label: "Vencido", tone: "danger" },
  fuera_servicio: { label: "Fuera de servicio", tone: "danger" },
  retirado: { label: "Retirado", tone: "neutral" },
};

export const inspectionResultMeta: Record<InspectionResult, { label: string; tone: Tone }> = {
  aprobado: { label: "Aprobado", tone: "success" },
  aprobado_con_observaciones: { label: "Aprobado con observaciones", tone: "warning" },
  rechazado: { label: "Rechazado", tone: "danger" },
  pendiente: { label: "Pendiente", tone: "neutral" },
};

export const productStatusMeta: Record<ProductStatus, { label: string; tone: Tone }> = {
  activo: { label: "Activo", tone: "success" },
  descontinuado: { label: "Descontinuado", tone: "neutral" },
  borrador: { label: "Borrador", tone: "warning" },
};

export function StatusPill({
  label,
  tone = "neutral",
  className,
  size = "md",
}: {
  label: string;
  tone?: Tone;
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-semibold whitespace-nowrap",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        toneClasses[tone],
        className,
      )}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" aria-hidden="true" />
      {label}
    </span>
  );
}

export function EquipmentStatusBadge({
  status,
  size,
  className,
}: {
  status: EquipmentStatus;
  size?: "sm" | "md";
  className?: string;
}) {
  const meta = equipmentStatusMeta[status];
  return <StatusPill label={meta.label} tone={meta.tone} size={size} className={className} />;
}

export function InspectionResultBadge({ result }: { result: InspectionResult }) {
  const meta = inspectionResultMeta[result];
  return <StatusPill label={meta.label} tone={meta.tone} size="sm" />;
}
