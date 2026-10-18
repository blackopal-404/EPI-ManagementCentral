import type { Report, TechnicalDocument } from "@/types";
import { mockProducts } from "./products";

/** Documentos MOCK: las URLs son simuladas, no existe almacenamiento real. */
export const mockDocuments: TechnicalDocument[] = mockProducts.flatMap((product, i) => {
  const base: TechnicalDocument[] = [
    {
      id: `doc-${i + 1}-1`,
      productId: product.id,
      type: "manual",
      title: `Manual de usuario — ${product.model}`,
      fileUrl: `mock://documentos/${product.code}/manual.pdf`,
      fileSize: "2,4 MB",
      version: "v3.1",
      updatedAt: "2026-05-12",
    },
    {
      id: `doc-${i + 1}-2`,
      productId: product.id,
      type: "ficha_tecnica",
      title: `Ficha técnica — ${product.model}`,
      fileUrl: `mock://documentos/${product.code}/ficha-tecnica.pdf`,
      fileSize: "860 KB",
      version: "v2.0",
      updatedAt: "2026-04-02",
    },
    {
      id: `doc-${i + 1}-3`,
      productId: product.id,
      type: "certificado",
      title: `Certificado CE de tipo — ${product.model}`,
      fileUrl: `mock://documentos/${product.code}/certificado-ce.pdf`,
      fileSize: "1,1 MB",
      version: "2025",
      updatedAt: "2025-12-18",
    },
  ];

  if (i % 3 !== 2) {
    base.push({
      id: `doc-${i + 1}-4`,
      productId: product.id,
      type: "declaracion_conformidad",
      title: `Declaración de conformidad UE — ${product.model}`,
      fileUrl: `mock://documentos/${product.code}/declaracion-conformidad.pdf`,
      fileSize: "420 KB",
      version: "v1.3",
      updatedAt: "2026-01-30",
    });
  }

  return base;
});

export const documentTypeLabels: Record<TechnicalDocument["type"], string> = {
  manual: "Manual",
  ficha_tecnica: "Ficha técnica",
  certificado: "Certificado",
  declaracion_conformidad: "Declaración de conformidad",
  otro: "Otro documento",
};

const demoReports: Report[] = [
  { id: "rep-01", name: "Inventario general", description: "Existencias por producto, disponibles, asignados y bloqueados.", rows: 20, updatedAt: "2026-09-09" },
  { id: "rep-02", name: "Equipos vencidos", description: "Equipos con inspección vencida o vida útil superada.", rows: 4, updatedAt: "2026-09-09" },
  { id: "rep-03", name: "Próximas inspecciones", description: "Equipos con inspección programada en los próximos 30 días.", rows: 6, updatedAt: "2026-09-08" },
  { id: "rep-04", name: "Equipos fuera de servicio", description: "Equipos bloqueados, en mantenimiento o retirados.", rows: 5, updatedAt: "2026-09-07" },
  { id: "rep-05", name: "Inspecciones realizadas", description: "Registro de inspecciones por inspector y resultado.", rows: 10, updatedAt: "2026-09-06" },
  { id: "rep-06", name: "Historial de equipos", description: "Trazabilidad completa de eventos por equipo individual.", rows: 10, updatedAt: "2026-09-05" },
];

export const mockReports: Report[] = import.meta.env.DEV ? demoReports : [];
