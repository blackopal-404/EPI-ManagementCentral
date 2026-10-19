import type { Equipment, EquipmentStatus } from "@/types";
import { mockProducts } from "./products";

const locations = [
  "Planta Norte — Almacén EPP",
  "Planta Sur — Taller mecánico",
  "Centro de Distribución",
  "Obra Puerto — Contenedor 3",
  "Taller de mantenimiento",
  "Torre de enfriamiento",
];

const prefixes: Record<string, string> = {
  "cat-01": "ARN",
  "cat-02": "CSC",
  "cat-03": "GAF",
  "cat-04": "AUD",
  "cat-05": "RES",
  "cat-06": "EPI",
  "cat-07": "RSC",
  "cat-08": "EMG",
};

interface Row {
  productIndex: number;
  status: EquipmentStatus;
  userId?: string;
  last?: string;
  next?: string;
  notes?: string;
}

const rows: Row[] = [
  { productIndex: 0, status: "asignado", userId: "usr-01", last: "2026-08-15", next: "2026-09-16" },
  { productIndex: 0, status: "activo", userId: "usr-07", last: "2026-06-10", next: "2026-12-10" },
  { productIndex: 0, status: "proximo_vencer", userId: "usr-03", last: "2026-03-12", next: "2026-09-14", notes: "Inspección semestral próxima." },
  { productIndex: 0, status: "disponible", last: "2026-07-02", next: "2027-01-02" },
  { productIndex: 1, status: "asignado", userId: "usr-05", last: "2026-05-21", next: "2026-11-21" },
  { productIndex: 1, status: "en_inspeccion", userId: "usr-04", last: "2026-09-01", next: "2027-03-01" },
  { productIndex: 2, status: "fuera_servicio", last: "2026-04-18", next: "2026-10-18", notes: "Funda con abrasión severa. Pendiente de baja técnica." },
  { productIndex: 2, status: "activo", userId: "usr-01", last: "2026-08-01", next: "2027-02-01" },
  { productIndex: 3, status: "disponible", last: "2026-07-19", next: "2027-01-19" },
  { productIndex: 4, status: "asignado", userId: "usr-09", last: "2026-08-05", next: "2027-02-05" },
  { productIndex: 4, status: "vencido", userId: "usr-08", last: "2025-08-11", next: "2026-08-11", notes: "Inspección vencida hace más de 20 días." },
  { productIndex: 5, status: "activo", last: "2026-06-30", next: "2026-12-30" },
  { productIndex: 5, status: "retirado", last: "2025-11-02", next: "2026-05-02", notes: "Retirado por antigüedad." },
  { productIndex: 6, status: "mantenimiento", last: "2026-08-25", next: "2027-02-25" },
  { productIndex: 6, status: "asignado", userId: "usr-03", last: "2026-07-14", next: "2027-01-14" },
  { productIndex: 7, status: "vencido", userId: "usr-07", last: "2025-07-20", next: "2026-07-20", notes: "Inspección vencida." },
  { productIndex: 7, status: "activo", userId: "usr-05", last: "2026-08-18", next: "2027-02-18" },
  { productIndex: 7, status: "disponible", last: "2026-08-18", next: "2027-02-18" },
  { productIndex: 8, status: "asignado", userId: "usr-09", last: "2026-05-09", next: "2026-11-09" },
  { productIndex: 8, status: "proximo_vencer", userId: "usr-01", last: "2026-03-19", next: "2026-09-19" },
  { productIndex: 9, status: "disponible", last: "2026-08-02", next: "2027-08-02" },
  { productIndex: 9, status: "activo", userId: "usr-07", last: "2026-08-02", next: "2027-08-02" },
  { productIndex: 10, status: "disponible", last: "2026-07-25", next: "2027-07-25" },
  { productIndex: 11, status: "asignado", userId: "usr-06", last: "2026-06-15", next: "2027-06-15" },
  { productIndex: 11, status: "mantenimiento", last: "2026-08-28", next: "2027-08-28" },
  { productIndex: 12, status: "disponible", last: "2026-04-04", next: "2027-04-04" },
  { productIndex: 13, status: "asignado", userId: "usr-03", last: "2026-08-10", next: "2026-11-10" },
  { productIndex: 13, status: "proximo_vencer", userId: "usr-04", last: "2026-06-13", next: "2026-09-13" },
  { productIndex: 14, status: "disponible", last: "2026-08-30", next: "2027-02-28" },
  { productIndex: 14, status: "vencido", last: "2025-09-01", next: "2026-03-01", notes: "Filtro caducado, pendiente de reposición." },
  { productIndex: 15, status: "asignado", userId: "usr-05", last: "2026-07-07", next: "2027-07-07" },
  { productIndex: 15, status: "activo", userId: "usr-09", last: "2026-07-07", next: "2027-07-07" },
  { productIndex: 16, status: "asignado", userId: "usr-07", last: "2026-05-28", next: "2027-05-28" },
  { productIndex: 16, status: "fuera_servicio", last: "2026-02-11", next: "2026-08-11", notes: "Suela desprendida." },
  { productIndex: 17, status: "disponible", last: "2026-08-21", next: "2027-08-21" },
  { productIndex: 18, status: "activo", last: "2026-06-05", next: "2027-06-05" },
  { productIndex: 18, status: "en_inspeccion", last: "2026-09-02", next: "2027-09-02" },
  { productIndex: 19, status: "activo", last: "2026-04-22", next: "2027-04-22" },
  { productIndex: 19, status: "proximo_vencer", last: "2026-03-16", next: "2026-09-18" },
  { productIndex: 19, status: "disponible", last: "2026-04-22", next: "2027-04-22" },
];

const counters: Record<string, number> = {};

export const mockEquipment: Equipment[] = import.meta.env.DEV ? rows.map((row, i): Equipment | null => {
  const product = mockProducts[row.productIndex];
  if (!product) return null;
  const prefix = prefixes[product.categoryId] ?? "EPI";
  counters[prefix] = (counters[prefix] ?? 0) + 1;
  const internalCode = `${prefix}-${String(counters[prefix]).padStart(4, "0")}`;

  return {
    id: `eqp-${String(i + 1).padStart(3, "0")}`,
    internalCode,
    serialNumber: `${product.model}-${2024 + (i % 3)}-${String(41000 + i * 137).slice(0, 5)}`,
    productId: product.id,
    status: row.status,
    manufacturingDate: `${2022 + (i % 4)}-0${(i % 9) + 1}-1${i % 9}`,
    purchaseDate: `${2023 + (i % 3)}-0${(i % 9) + 1}-2${i % 8}`,
    commissioningDate: `${2023 + (i % 3)}-1${i % 2}-0${(i % 8) + 1}`,
    location: locations[i % locations.length] ?? "Sin ubicación",
    ...(row.userId ? { assignedUserId: row.userId } : {}),
    ...(row.last ? { lastInspectionDate: row.last } : {}),
    ...(row.next ? { nextInspectionDate: row.next } : {}),
    serviceLife: product.serviceLife,
    ...(row.notes ? { notes: row.notes } : {}),
    qrCode: `EQUIPMENT:${internalCode}`,
    ...(i < 4 ? { dataMatrixCode: `${product.model}-${2024 + (i % 3)}-${String(41000 + i * 137).slice(0, 5)}` } : {}),
    createdAt: "2025-01-10T09:00:00Z",
    updatedAt: "2026-09-01T09:00:00Z",
  };
}).filter((item): item is Equipment => item !== null) : [];

export const getEquipment = (id: string) => mockEquipment.find((e) => e.id === id);
export const getEquipmentByCode = (code: string) =>
  mockEquipment.find((e) => e.internalCode.toLowerCase() === code.toLowerCase());
