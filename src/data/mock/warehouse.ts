import type { WarehouseProduct } from "@/types";

const demoWarehouseProducts: WarehouseProduct[] = [
  { id: "wh-001", productId: "prd-01", sku: "ARN-AX102", name: "Arnés anticaídas integral AX-102", image: "/epp-harness.jpg", quantity: 18, minStock: 5, costPrice: 62, salePrice: 95, location: "Bodega A · Estante 01", supplier: "Proveedor homologado", active: true, updatedAt: "2026-09-09" },
  { id: "wh-002", productId: "prd-08", sku: "CSC-CP203", name: "Casco de altura CP-203", image: "/epp-helmet.jpg", quantity: 34, minStock: 10, costPrice: 28, salePrice: 49, location: "Bodega A · Estante 02", supplier: "Proveedor homologado", active: true, updatedAt: "2026-09-09" },
  { id: "wh-003", productId: "prd-03", sku: "LDV-LV019", name: "Línea de vida vertical LV-019", image: "/epp-rope.jpg", quantity: 7, minStock: 4, costPrice: 110, salePrice: 168, location: "Bodega B · Estante 04", supplier: "Proveedor homologado", active: true, updatedAt: "2026-09-09" },
  { id: "wh-004", productId: "prd-05", sku: "ESL-ES115", name: "Eslinga doble con absorbedor ES-115", image: "/epp-rope.jpg", quantity: 3, minStock: 5, costPrice: 54, salePrice: 82, location: "Bodega B · Estante 05", supplier: "Proveedor homologado", active: true, updatedAt: "2026-09-09" },
];

export const mockWarehouseProducts: WarehouseProduct[] = import.meta.env.DEV ? demoWarehouseProducts : [];
