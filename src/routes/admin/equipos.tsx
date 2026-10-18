import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Edit3, PackagePlus, ScanLine, Trash2, X } from "lucide-react";
import { equipmentService } from "@/services";
import { SectionCard } from "@/components/common/SectionCard";
import { EquipmentTable } from "@/components/equipment/EquipmentTable";
import { mockProducts } from "@/data/mock/products";
import type { Equipment, EquipmentStatus } from "@/types";
import { CameraQrScanner } from "@/components/qr/CameraQrScanner";
import { BarcodeFormat } from "@zxing/browser";

export const Route = createFileRoute("/admin/equipos")({ component: AdminEquipment });

const statuses: EquipmentStatus[] = [
  "activo", "disponible", "asignado", "en_inspeccion", "mantenimiento",
  "proximo_vencer", "vencido", "fuera_servicio", "retirado",
];

const blankEquipment = (): Equipment => ({
  id: `eqp-${Date.now()}`,
  internalCode: `EPI-${String(Date.now()).slice(-4)}`,
  serialNumber: "",
  productId: mockProducts[0]?.id ?? "",
  status: "disponible",
  manufacturingDate: "",
  purchaseDate: new Date().toISOString().slice(0, 10),
  commissioningDate: "",
  location: "Bodega principal",
  serviceLife: mockProducts[0]?.serviceLife ?? "",
  notes: "",
  qrCode: "",
  dataMatrixCode: "",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

function AdminEquipment() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["admin-equipment"], queryFn: () => equipmentService.getEquipment() });
  const [editing, setEditing] = useState<Equipment | null>(null);

  async function save(item: Equipment) {
    const all = await equipmentService.getEquipment();
    const duplicate = all.find((existing) =>
      existing.id !== item.id &&
      ((item.dataMatrixCode && existing.dataMatrixCode?.trim().toLowerCase() === item.dataMatrixCode.trim().toLowerCase()) ||
        existing.serialNumber.trim().toLowerCase() === item.serialNumber.trim().toLowerCase() ||
        existing.internalCode.trim().toLowerCase() === item.internalCode.trim().toLowerCase())
    );
    if (duplicate) {
      alert("Ya existe un equipo con ese código interno, número de serie o código Data Matrix.");
      return;
    }
    await equipmentService.upsertEquipment({
      ...item,
      dataMatrixCode: item.dataMatrixCode?.trim() || undefined,
      qrCode: item.qrCode.trim() || `EQUIPMENT:${item.internalCode}`,
      updatedAt: new Date().toISOString(),
    });
    setEditing(null);
    await qc.invalidateQueries({ queryKey: ["admin-equipment"] });
    await qc.invalidateQueries({ queryKey: ["equipment"] });
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar esta unidad de equipos?")) return;
    await equipmentService.deleteEquipment(id);
    qc.invalidateQueries({ queryKey: ["admin-equipment"] });
    qc.invalidateQueries({ queryKey: ["equipment"] });
  }

  return (
    <div className="space-y-5 pb-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="label-caps">Administración</p>
          <h1 className="mt-1 font-display text-2xl font-extrabold">Equipos</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Registra cada unidad física y, cuando exista, guarda su código Data Matrix para localizarla rápidamente al escanearla.
          </p>
        </div>
        <button onClick={() => setEditing(blankEquipment())} className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground">
          <PackagePlus className="h-4 w-4" /> Agregar equipo
        </button>
      </header>

      <SectionCard title={`${data.length} unidades`} description="Los cambios se guardan localmente durante esta etapa de la aplicación.">
        <EquipmentTable equipment={data} onEdit={setEditing} onDelete={remove} />
      </SectionCard>

      {editing && <EquipmentForm value={editing} onCancel={() => setEditing(null)} onSave={save} />}
    </div>
  );
}

function EquipmentForm({ value, onCancel, onSave }: { value: Equipment; onCancel: () => void; onSave: (value: Equipment) => void }) {
  const [v, setV] = useState(value);
  const set = <K extends keyof Equipment>(key: K, value: Equipment[K]) => setV((current) => ({ ...current, [key]: value }));
  const selectedProduct = mockProducts.find((p) => p.id === v.productId);
  const isNew = !value.serialNumber;
  const [showScanner, setShowScanner] = useState(false);

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/60 p-4">
      <form onSubmit={(e) => { e.preventDefault(); onSave(v); }} className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-card p-5 shadow-panel sm:p-6">
        <div className="flex items-start gap-3">
          <ScanLine className="mt-0.5 h-5 w-5 text-primary" />
          <div>
            <h2 className="font-display text-lg font-extrabold">{isNew ? "Nuevo equipo" : "Editar equipo"}</h2>
            <p className="text-xs text-muted-foreground">La identificación Data Matrix es opcional.</p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="space-y-1 text-sm font-semibold sm:col-span-2">
            <span>Producto del catálogo</span>
            <select value={v.productId} onChange={(e) => { const p = mockProducts.find((x) => x.id === e.target.value); setV((current) => ({ ...current, productId: e.target.value, serviceLife: p?.serviceLife ?? current.serviceLife })); }} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm font-normal" required>
              {mockProducts.map((p) => <option key={p.id} value={p.id}>{p.code} · {p.name}</option>)}
            </select>
          </label>

          <Field label="Código interno" value={v.internalCode} onChange={(x) => set("internalCode", x)} required />
          <Field label="Número de serie" value={v.serialNumber} onChange={(x) => set("serialNumber", x)} required />

          <label className="space-y-1 text-sm font-semibold sm:col-span-2">
            <span className="flex items-center gap-2">Código Data Matrix <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">Opcional</span></span>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input value={v.dataMatrixCode ?? ""} onChange={(e) => set("dataMatrixCode", e.target.value)} placeholder="Contenido del Data Matrix" className="h-10 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm font-normal" />
              <button type="button" onClick={() => setShowScanner((open) => !open)} className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md border border-border px-3 text-sm font-bold hover:bg-muted">
                {showScanner ? <X className="h-4 w-4" /> : <ScanLine className="h-4 w-4" />}
                {showScanner ? "Cerrar lector" : "Escanear Data Matrix"}
              </button>
            </div>
            <span className="block text-xs font-normal text-muted-foreground">Puedes escribirlo manualmente o escanearlo con la cámara. El valor quedará asociado exclusivamente a esta unidad física.</span>
          </label>

          {showScanner && (
            <div className="rounded-xl border border-primary/30 bg-muted/20 p-3 sm:col-span-2 sm:p-4">
              <div className="mb-3">
                <p className="text-sm font-bold">Escanear Data Matrix del equipo</p>
                <p className="mt-1 text-xs text-muted-foreground">Apunta la cámara al Data Matrix de la etiqueta. Al detectarlo, el contenido se copiará automáticamente al campo anterior.</p>
              </div>
              <CameraQrScanner
                formats={[BarcodeFormat.DATA_MATRIX]}
                title="Activar cámara y leer Data Matrix"
                searchingLabel="Buscando Data Matrix…"
                onDetected={(code) => {
                  set("dataMatrixCode", code);
                  setShowScanner(false);
                }}
              />
            </div>
          )}

          <label className="space-y-1 text-sm font-semibold">
            <span>Estado</span>
            <select value={v.status} onChange={(e) => set("status", e.target.value as EquipmentStatus)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm font-normal">
              {statuses.map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}
            </select>
          </label>
          <Field label="Ubicación" value={v.location} onChange={(x) => set("location", x)} required />
          <Field label="Fecha de fabricación" type="date" value={v.manufacturingDate} onChange={(x) => set("manufacturingDate", x)} />
          <Field label="Fecha de adquisición" type="date" value={v.purchaseDate} onChange={(x) => set("purchaseDate", x)} />
          <Field label="Puesta en servicio" type="date" value={v.commissioningDate} onChange={(x) => set("commissioningDate", x)} />
          <Field label="Próxima inspección" type="date" value={v.nextInspectionDate ?? ""} onChange={(x) => set("nextInspectionDate", x || undefined)} />
          <Field label="Vida útil" value={v.serviceLife} onChange={(x) => set("serviceLife", x)} />

          <label className="space-y-1 text-sm font-semibold sm:col-span-2">
            <span>Notas</span>
            <textarea value={v.notes ?? ""} onChange={(e) => set("notes", e.target.value)} rows={3} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-normal" />
          </label>
        </div>

        {selectedProduct && <p className="mt-4 rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">Producto seleccionado: <strong>{selectedProduct.name}</strong>. La información técnica del producto se mantiene en el catálogo.</p>}

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="rounded-md border border-border px-4 py-2 text-sm font-bold">Cancelar</button>
          <button className="rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">Guardar equipo</button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return <label className="space-y-1 text-sm font-semibold"><span>{label}</span><input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm font-normal" /></label>;
}
