/**
 * Capa de servicios del frontend.
 *
 * Hoy resuelven contra MOCK DATA en memoria, pero la firma es asíncrona y
 * agnóstica del origen: cuando exista el backend, basta sustituir el cuerpo de
 * cada método por una llamada HTTP a la API sin tocar los componentes.
 *
 *   Frontend -> Servicios -> API -> Backend -> SQL
 */
import type {
  AlertItem,
  Category,
  DashboardMetrics,
  Equipment,
  EquipmentHistory,
  Inspection,
  InspectionDraft,
  InventorySummary,
  Manufacturer,
  Product,
  Report,
  Role,
  TechnicalDocument,
  User,
} from "@/types";
import { mockCategories, mockManufacturers, mockRoles } from "@/data/mock/categories";
import { mockProducts } from "@/data/mock/products";
import { mockEquipment } from "@/data/mock/equipment";
import { mockHistory, mockInspections } from "@/data/mock/inspections";
import { mockDocuments, mockReports } from "@/data/mock/documents";
import { mockUsers } from "@/data/mock/users";

import type { QuoteCompanyProfile, QuoteCustomer, WarehouseProduct, SaleRecord, SaleLine, SalePaymentMethod } from "@/types";
import { mockWarehouseProducts } from "@/data/mock/warehouse";

/** Simula la latencia de una llamada de red. */
const delay = <T,>(value: T, ms = 120): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export interface ProductFilters {
  search?: string;
  categoryId?: string;
  manufacturerId?: string;
  equipmentType?: string;
  status?: string;
  standard?: string;
  usage?: string;
  sort?: "nombre" | "codigo" | "categoria" | "reciente";
}

const PRODUCT_IMAGE_OVERRIDES_KEY = "epicontrol:product-image-overrides";
function readProductImageOverrides(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(PRODUCT_IMAGE_OVERRIDES_KEY) ?? "{}") as Record<string, string>; }
  catch { return {}; }
}
export const productService = {
  async saveProductImage(productId: string, imageDataUrl: string): Promise<void> {
    if (typeof window === "undefined") throw new Error("La edición de imágenes requiere un navegador.");
    const overrides = readProductImageOverrides();
    overrides[productId] = imageDataUrl;
    localStorage.setItem(PRODUCT_IMAGE_OVERRIDES_KEY, JSON.stringify(overrides));
  },
  async getProducts(filters: ProductFilters = {}): Promise<Product[]> {
    const imageOverrides = readProductImageOverrides();
    let list = clone(mockProducts).map((product) => {
      const image = imageOverrides[product.id];
      if (!image) return product;
      const primary = product.images.find((item) => item.isPrimary) ?? product.images[0];
      const replacement = { id: `admin-image-${product.id}`, url: image, alt: `${product.name} — imagen agregada desde administración`, isPrimary: true };
      return { ...product, images: [replacement, ...product.images.filter((item) => item.id !== primary?.id).map((item) => ({ ...item, isPrimary: false }))] };
    });
    const q = filters.search?.trim().toLowerCase();
    if (q) {
      list = list.filter((p) =>
        [p.name, p.code, p.model, p.sku, p.equipmentType].some((f) => f.toLowerCase().includes(q)),
      );
    }
    if (filters.categoryId) list = list.filter((p) => p.categoryId === filters.categoryId);
    if (filters.manufacturerId) list = list.filter((p) => p.manufacturerId === filters.manufacturerId);
    if (filters.equipmentType) list = list.filter((p) => p.equipmentType === filters.equipmentType);
    if (filters.status) list = list.filter((p) => p.status === filters.status);
    if (filters.usage) list = list.filter((p) => p.usage === filters.usage);
    if (filters.standard) list = list.filter((p) => p.standards.some((s) => s === filters.standard));

    switch (filters.sort) {
      case "codigo":
        list.sort((a, b) => a.code.localeCompare(b.code));
        break;
      case "categoria":
        list.sort((a, b) => a.categoryId.localeCompare(b.categoryId));
        break;
      case "reciente":
        list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
        break;
      default:
        list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return delay(list);
  },
  async getProductById(id: string): Promise<Product | undefined> {
    return (await this.getProducts()).find((product) => product.id === id);
  },
  async getProductByCode(code: string): Promise<Product | undefined> {
    return (await this.getProducts()).find((product) => product.code.toLowerCase() === code.toLowerCase());
  },
  async getFilterOptions() {
    return delay({
      equipmentTypes: [...new Set(mockProducts.map((p) => p.equipmentType))].sort(),
      usages: [...new Set(mockProducts.map((p) => p.usage))].sort(),
      standards: [...new Set(mockProducts.flatMap((p) => p.standards))].sort(),
    });
  },
};

export interface EquipmentFilters {
  search?: string;
  status?: string;
  productId?: string;
  location?: string;
  assignedUserId?: string;
}

const EQUIPMENT_KEY = "sgh:equipment";

export const equipmentService = {
  async getEquipment(filters: EquipmentFilters = {}): Promise<Equipment[]> {
    let list = clone(readLocal(EQUIPMENT_KEY, mockEquipment));
    const q = filters.search?.trim().toLowerCase();
    if (q) {
      list = list.filter((e) =>
        [e.internalCode, e.serialNumber, e.dataMatrixCode ?? "", e.location].some((f) => f.toLowerCase().includes(q)),
      );
    }
    if (filters.status) list = list.filter((e) => e.status === filters.status);
    if (filters.productId) list = list.filter((e) => e.productId === filters.productId);
    if (filters.location) list = list.filter((e) => e.location === filters.location);
    if (filters.assignedUserId) list = list.filter((e) => e.assignedUserId === filters.assignedUserId);
    return delay(list);
  },
  async getEquipmentById(id: string): Promise<Equipment | undefined> {
    return delay(clone(readLocal(EQUIPMENT_KEY, mockEquipment).find((e) => e.id === id)));
  },
  async getEquipmentByInternalCode(code: string): Promise<Equipment | undefined> {
    return delay(clone(readLocal(EQUIPMENT_KEY, mockEquipment).find((e) => e.internalCode.toLowerCase() === code.toLowerCase())));
  },
  async getEquipmentBySerialNumber(serial: string): Promise<Equipment | undefined> {
    return delay(clone(readLocal(EQUIPMENT_KEY, mockEquipment).find((e) => e.serialNumber.toLowerCase() === serial.toLowerCase())));
  },
  /**
   * Busca una unidad a partir de cualquier código leído por cámara.
   * Soporta payloads internos, URLs y números de serie (incluido Data Matrix de Petzl).
   */
  async getEquipmentByScanCode(code: string): Promise<Equipment | undefined> {
    const normalized = codeService.parse(code);
    if (!normalized) return delay(undefined);
    const items = readLocal(EQUIPMENT_KEY, mockEquipment);
    const normalizedLower = normalized.toLowerCase();
    return delay(clone(items.find((e) =>
      e.internalCode.toLowerCase() === normalizedLower ||
      e.serialNumber.toLowerCase() === normalizedLower ||
      (e.dataMatrixCode ?? "").toLowerCase() === normalizedLower
    )));
  },
  /** Compatibilidad con la API anterior. */
  async getEquipmentByQrCode(code: string): Promise<Equipment | undefined> {
    return this.getEquipmentByScanCode(code);
  },
  async getHistory(equipmentId: string): Promise<EquipmentHistory[]> {
    const list = clone(mockHistory.filter((h) => h.equipmentId === equipmentId));
    if (list.length) return delay(list.sort((a, b) => b.date.localeCompare(a.date)));
    const equipment = readLocal(EQUIPMENT_KEY, mockEquipment).find((e) => e.id === equipmentId);
    return delay(
      equipment
        ? [
            {
              id: `${equipmentId}-h1`,
              equipmentId,
              date: equipment.lastInspectionDate ?? equipment.commissioningDate,
              type: "inspeccion",
              title: "Inspección realizada",
              detail: "Registro de la última inspección documentada.",
              actor: "Carlos Medina",
            },
            {
              id: `${equipmentId}-h2`,
              equipmentId,
              date: equipment.commissioningDate,
              type: "alta",
              title: "Puesta en servicio",
              detail: `Ubicación inicial: ${equipment.location}.`,
              actor: "María Solís",
            },
          ]
        : [],
    );
  },
  async getLocations(): Promise<string[]> {
    const items = readLocal(EQUIPMENT_KEY, mockEquipment);
    return delay([...new Set(items.map((e) => e.location))].sort());
  },
  async upsertEquipment(item: Equipment): Promise<Equipment> {
    const items = readLocal(EQUIPMENT_KEY, mockEquipment);
    const index = items.findIndex((x) => x.id === item.id);
    if (index >= 0) items[index] = item; else items.unshift(item);
    writeLocal(EQUIPMENT_KEY, items);
    return delay(clone(item));
  },
  async deleteEquipment(id: string): Promise<boolean> {
    const items = readLocal(EQUIPMENT_KEY, mockEquipment).filter((x) => x.id !== id);
    writeLocal(EQUIPMENT_KEY, items);
    return delay(true);
  },
};

export const codeService = {
  /**
   * Normaliza el contenido leído por cámara.
   * Un Data Matrix de Petzl puede entregar directamente el número de serie.
   */
  parse(raw: string): string | null {
    const value = raw.trim();
    if (!value) return null;
    if (value.toUpperCase().startsWith("EQUIPMENT:")) return value.slice(10).trim();
    const match = value.match(/\/equipment\/([^/?#]+)/i);
    if (match?.[1]) return decodeURIComponent(match[1]);
    return value;
  },
  /** Escaneo simulado para pruebas locales. */
  async scan(): Promise<string> {
    if (!import.meta.env.DEV) throw new Error("El escaneo simulado solo está disponible en desarrollo. En producción se utiliza la cámara real.");
    const candidates = mockEquipment.filter((e) => e.status !== "retirado");
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    if (!pick) throw new Error("No hay equipos de demostración disponibles para simular un escaneo.");
    return delay(pick.qrCode, 900);
  },
  buildQrPayload(internalCode: string) {
    return `EQUIPMENT:${internalCode}`;
  },
};

/** Alias legado para no romper integraciones existentes. */
export const qrService = codeService;

export const categoryService = {
  async getCategories(): Promise<Category[]> {
    return delay(clone(mockCategories).sort((a, b) => a.order - b.order));
  },
  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    return delay(clone(mockCategories.find((c) => c.slug === slug)));
  },
  async getManufacturers(): Promise<Manufacturer[]> {
    return delay(clone(mockManufacturers));
  },
};

export const inspectionService = {
  async getInspections(): Promise<Inspection[]> {
    return delay(clone(mockInspections).sort((a, b) => b.date.localeCompare(a.date)));
  },
  async getInspectionsByEquipment(equipmentId: string): Promise<Inspection[]> {
    return delay(clone(mockInspections.filter((i) => i.equipmentId === equipmentId)));
  },
  /** MOCK: no persiste nada. El backend futuro validará y guardará el registro. */
  async registerInspection(draft: InspectionDraft): Promise<{ ok: true; draft: InspectionDraft }> {
    return delay({ ok: true as const, draft }, 400);
  },
};

export const inventoryService = {
  async getInventory(): Promise<InventorySummary[]> {
    const summary = mockProducts.map((product) => {
      const units = mockEquipment.filter((e) => e.productId === product.id);
      return {
        productId: product.id,
        productCode: product.code,
        productName: product.name,
        categoryId: product.categoryId,
        total: units.length,
        available: units.filter((u) => u.status === "disponible" || u.status === "activo").length,
        assigned: units.filter((u) => u.status === "asignado").length,
        maintenance: units.filter((u) => u.status === "mantenimiento" || u.status === "en_inspeccion").length,
        outOfService: units.filter(
          (u) => u.status === "fuera_servicio" || u.status === "vencido" || u.status === "retirado",
        ).length,
      };
    });
    return delay(summary.filter((s) => s.total > 0));
  },
};

export const userService = {
  async getUsers(): Promise<User[]> {
    return delay(clone(mockUsers));
  },
  async getUserById(id: string): Promise<User | undefined> {
    return delay(clone(mockUsers.find((u) => u.id === id)));
  },
  async getRoles(): Promise<Role[]> {
    return delay(clone(mockRoles));
  },
};

export const documentService = {
  async getDocumentsByProduct(productId: string): Promise<TechnicalDocument[]> {
    return delay(clone(mockDocuments.filter((d) => d.productId === productId)));
  },
  async getAllDocuments(): Promise<TechnicalDocument[]> {
    return delay(clone(mockDocuments));
  },
};

export const reportService = {
  async getReports(): Promise<Report[]> {
    return delay(clone(mockReports));
  },
  /** MOCK: la exportación real se implementará contra el backend. */
  async export(reportId: string, format: "excel" | "pdf") {
    return delay({ ok: true as const, reportId, format }, 400);
  },
};

export const dashboardService = {
  async getMetrics(): Promise<DashboardMetrics> {
    const s = (status: string) => mockEquipment.filter((e) => e.status === status).length;
    return delay({
      total: mockEquipment.length,
      active: s("activo") + s("asignado") + s("disponible"),
      inInspection: s("en_inspeccion") + s("mantenimiento"),
      expiringSoon: s("proximo_vencer"),
      expired: s("vencido"),
      outOfService: s("fuera_servicio") + s("retirado"),
    });
  },
  async getByCategory() {
    const data = mockCategories.map((c) => ({
      name: c.name,
      total: mockEquipment.filter((e) => {
        const product = mockProducts.find((p) => p.id === e.productId);
        return product?.categoryId === c.id;
      }).length,
    }));
    return delay(data.filter((d) => d.total > 0));
  },
  async getUpcomingInspections() {
    const buckets = [
      { name: "0-7 días", total: 0 },
      { name: "8-15 días", total: 0 },
      { name: "16-30 días", total: 0 },
      { name: "31-90 días", total: 0 },
    ];
    const today = new Date("2026-09-09");
    mockEquipment.forEach((e) => {
      if (!e.nextInspectionDate) return;
      const diff = Math.round(
        (new Date(e.nextInspectionDate).getTime() - today.getTime()) / 86_400_000,
      );
      if (diff < 0) return;
      if (diff <= 7 && buckets[0]) buckets[0].total += 1;
      else if (diff <= 15 && buckets[1]) buckets[1].total += 1;
      else if (diff <= 30 && buckets[2]) buckets[2].total += 1;
      else if (diff <= 90 && buckets[3]) buckets[3].total += 1;
    });
    return delay(buckets);
  },
  async getAlerts(): Promise<AlertItem[]> {
    const alerts: AlertItem[] = [];
    mockEquipment.forEach((e) => {
      const product = mockProducts.find((p) => p.id === e.productId);
      const label = `${product?.name ?? "Equipo"} · ${e.internalCode}`;
      if (e.status === "vencido") {
        alerts.push({
          id: `al-${e.id}`,
          severity: "danger",
          title: "Inspección vencida",
          message: `${label} tiene la inspección vencida desde ${e.nextInspectionDate}.`,
          equipmentCode: e.internalCode,
        });
      } else if (e.status === "fuera_servicio") {
        alerts.push({
          id: `al-${e.id}`,
          severity: "danger",
          title: "Equipo fuera de servicio",
          message: `${label} está bloqueado: ${e.notes ?? "revisar ficha del equipo"}.`,
          equipmentCode: e.internalCode,
        });
      } else if (e.status === "proximo_vencer") {
        alerts.push({
          id: `al-${e.id}`,
          severity: "warning",
          title: "Inspección próxima",
          message: `${label} debe inspeccionarse el ${e.nextInspectionDate}.`,
          equipmentCode: e.internalCode,
        });
      }
    });
    return delay(alerts);
  },
};

export interface GlobalSearchResult {
  id: string;
  type: "producto" | "equipo" | "categoria" | "usuario";
  title: string;
  subtitle: string;
  to: string;
  params?: Record<string, string>;
}

export const searchService = {
  async search(query: string): Promise<GlobalSearchResult[]> {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return delay([], 40);
    const results: GlobalSearchResult[] = [];

    mockEquipment
      .filter((e) => `${e.internalCode} ${e.serialNumber}`.toLowerCase().includes(q))
      .slice(0, 6)
      .forEach((e) => {
        const product = mockProducts.find((p) => p.id === e.productId);
        results.push({
          id: e.id,
          type: "equipo",
          title: `${e.internalCode} · ${product?.name ?? ""}`,
          subtitle: `Serie ${e.serialNumber} — ${e.status.replace(/_/g, " ")}`,
          to: "/equipment/$code",
          params: { code: e.internalCode },
        });
      });

    mockProducts
      .filter((p) => `${p.name} ${p.code} ${p.model}`.toLowerCase().includes(q))
      .slice(0, 6)
      .forEach((p) => {
        results.push({
          id: p.id,
          type: "producto",
          title: p.name,
          subtitle: `${p.code} — ${p.equipmentType}`,
          to: "/equipos/$productCode",
          params: { productCode: p.code },
        });
      });

    mockCategories
      .filter((c) => c.name.toLowerCase().includes(q))
      .slice(0, 4)
      .forEach((c) => {
        results.push({
          id: c.id,
          type: "categoria",
          title: c.name,
          subtitle: "Categoría del catálogo",
          to: "/categorias",
        });
      });

    mockUsers
      .filter((u) => `${u.fullName} ${u.email}`.toLowerCase().includes(q))
      .slice(0, 4)
      .forEach((u) => {
        results.push({
          id: u.id,
          type: "usuario",
          title: u.fullName,
          subtitle: `${u.email} — ${u.role}`,
          to: "/admin/usuarios",
        });
      });

    return delay(results, 60);
  },
};

// ---------------- Inventario de bodega / distribución ----------------

const WAREHOUSE_KEY = "sgh:warehouse";
const PROFILE_KEY = "sgh:quote-profile";

function readLocal<T>(key: string, fallback: T): T {
  // localStorage is only a development/demo adapter. Production must read from the API.
  if (!import.meta.env.DEV || typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function writeLocal<T>(key: string, value: T) {
  if (!import.meta.env.DEV) {
    throw new Error("La persistencia de producción aún no está conectada. No se guardó ningún cambio localmente.");
  }
  if (typeof window !== "undefined") window.localStorage.setItem(key, JSON.stringify(value));
}

export const warehouseService = {
  async getProducts(): Promise<WarehouseProduct[]> { return delay(clone(readLocal(WAREHOUSE_KEY, mockWarehouseProducts))); },
  async saveProducts(items: WarehouseProduct[]) { writeLocal(WAREHOUSE_KEY, items); return delay(clone(items)); },
  async upsertProduct(item: WarehouseProduct) {
    const items = readLocal(WAREHOUSE_KEY, mockWarehouseProducts);
    const index = items.findIndex((x) => x.id === item.id);
    if (index >= 0) items[index] = item; else items.unshift(item);
    writeLocal(WAREHOUSE_KEY, items); return delay(clone(item));
  },
  async deleteProduct(id: string) {
    const items = readLocal(WAREHOUSE_KEY, mockWarehouseProducts).filter((x) => x.id !== id);
    writeLocal(WAREHOUSE_KEY, items); return delay(true);
  },
};

export const quoteService = {
  async getProfile(): Promise<QuoteCompanyProfile> {
    return delay(readLocal(PROFILE_KEY, { name: "Vertical Safety", address: "Configura la dirección de tu empresa", phone: "Configura el teléfono", email: "", logoDataUrl: "/vertical-safety-logo.png" }));
  },
  async saveProfile(profile: QuoteCompanyProfile) { writeLocal(PROFILE_KEY, profile); return delay(profile); },
  async buildQuote(customer: QuoteCustomer, items: { product: WarehouseProduct; quantity: number; unitPrice: number }[]) {
    return delay({ customer, items, subtotal: items.reduce((sum, x) => sum + x.quantity * x.unitPrice, 0) });
  },
};


// ---------------- Registro de ventas / carrito ----------------
const SALES_KEY = "sgh:sales";

export interface SaleDraft {
  customerName: string;
  customerContact: string;
  paymentMethod: SalePaymentMethod;
  notes: string;
  discount: number;
  lines: { warehouseProductId: string; quantity: number }[];
  createdBy: string;
}

export const salesService = {
  async getSales(): Promise<SaleRecord[]> {
    return delay(clone(readLocal<SaleRecord[]>(SALES_KEY, [])));
  },
  async registerSale(draft: SaleDraft): Promise<SaleRecord> {
    const products = readLocal(WAREHOUSE_KEY, mockWarehouseProducts);
    const currentSales = readLocal<SaleRecord[]>(SALES_KEY, []);
    if (!draft.lines.length) throw new Error("Agrega al menos un producto al carrito.");
    const normalized = new Map<string, number>();
    for (const line of draft.lines) {
      const qty = Math.floor(Number(line.quantity));
      if (!Number.isFinite(qty) || qty < 1) throw new Error("Todas las cantidades deben ser números enteros mayores que cero.");
      normalized.set(line.warehouseProductId, (normalized.get(line.warehouseProductId) ?? 0) + qty);
    }
    const saleLines: SaleLine[] = [];
    for (const [productId, quantity] of normalized) {
      const product = products.find((item) => item.id === productId);
      if (!product || !product.active) throw new Error("Uno de los productos ya no está disponible.");
      if (product.quantity < quantity) throw new Error(`Existencias insuficientes para ${product.name}. Disponibles: ${product.quantity}.`);
      saleLines.push({ warehouseProductId: product.id, sku: product.sku, name: product.name, quantity, unitPrice: product.salePrice, unitCost: product.costPrice, lineTotal: Number((quantity * product.salePrice).toFixed(2)) });
    }
    const subtotal = Number(saleLines.reduce((sum, line) => sum + line.lineTotal, 0).toFixed(2));
    const discount = Number(draft.discount || 0);
    if (!Number.isFinite(discount) || discount < 0 || discount > subtotal) throw new Error("El descuento debe estar entre cero y el subtotal.");
    const now = new Date();
    const sale: SaleRecord = {
      id: `sale-${now.getTime()}-${Math.random().toString(36).slice(2, 7)}`,
      saleNumber: `VS-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,"0")}${String(now.getDate()).padStart(2,"0")}-${String(currentSales.length+1).padStart(4,"0")}`,
      soldAt: now.toISOString(), customerName: draft.customerName.trim(), customerContact: draft.customerContact.trim(),
      paymentMethod: draft.paymentMethod, notes: draft.notes.trim(), lines: saleLines, subtotal, discount,
      total: Number((subtotal-discount).toFixed(2)), status: "completed", createdBy: draft.createdBy || "Usuario"
    };
    // Actualiza el inventario y registra la venta en la misma operación del navegador.
    const updatedProducts = products.map((product) => {
      const soldLine = saleLines.find((line) => line.warehouseProductId === product.id);
      return soldLine ? { ...product, quantity: product.quantity - soldLine.quantity, updatedAt: now.toISOString().slice(0,10) } : product;
    });
    writeLocal(WAREHOUSE_KEY, updatedProducts);
    writeLocal(SALES_KEY, [sale, ...currentSales]);
    return delay(clone(sale));
  },
};


export type PurchasePlanningMode = "reorder" | "coverage";
export interface PurchasePlanOptions {
  budget: number;
  horizonDays: number;
  mode: PurchasePlanningMode;
  demandMultiplier?: number;
}
export interface PurchasePlanLine {
  product: WarehouseProduct;
  dailyDemand: number | null;
  reorderPoint: number | null;
  suggestedQuantity: number;
  lineCost: number;
  reason: string;
  insufficientData: boolean;
}

/** Lógica pura de planificación. No registra compras ni modifica existencias. */
export const purchasePlanningService = {
  async getProducts(): Promise<WarehouseProduct[]> {
    return warehouseService.getProducts();
  },
  calculate(products: WarehouseProduct[], options: PurchasePlanOptions): PurchasePlanLine[] {
    const multiplier = Math.max(0, options.demandMultiplier ?? 1);
    return products.filter((p) => p.active).map((product) => {
      const demand = typeof product.dailyDemandEstimate === "number" && Number.isFinite(product.dailyDemandEstimate)
        ? Math.max(0, product.dailyDemandEstimate * multiplier)
        : null;
      const leadTime = Math.max(0, product.leadTimeDays ?? 0);
      const safety = Math.max(0, product.safetyStock ?? 0);
      const reorderPoint = demand === null ? null : demand * leadTime + safety;
      if (demand === null) {
        return { product, dailyDemand: null, reorderPoint, suggestedQuantity: 0, lineCost: 0, reason: "Datos insuficientes: registra una estimación de demanda en Bodega.", insufficientData: true };
      }
      const needsReorder = reorderPoint !== null && product.quantity <= reorderPoint;
      const targetDays = options.mode === "reorder" ? Math.max(leadTime, options.horizonDays) : Math.max(1, options.horizonDays);
      const targetDemand = demand * targetDays;
      let quantity = Math.max(0, Math.ceil(targetDemand + safety - product.quantity));
      if (options.mode === "reorder" && !needsReorder) quantity = 0;
      if (quantity > 0) {
        quantity = Math.max(quantity, Math.max(0, product.minPurchaseQuantity ?? 0));
        const multiple = Math.max(1, Math.floor(product.purchaseMultiple ?? 1));
        quantity = Math.ceil(quantity / multiple) * multiple;
        if (product.maxStock !== undefined && product.maxStock >= 0) {
          quantity = Math.min(quantity, Math.max(0, Math.ceil(product.maxStock - product.quantity)));
          if (quantity > 0 && quantity % multiple !== 0) quantity = Math.floor(quantity / multiple) * multiple;
          if (quantity > 0 && product.minPurchaseQuantity && quantity < product.minPurchaseQuantity) quantity = 0;
        }
      }
      const reason = quantity > 0
        ? (needsReorder ? `En o por debajo del punto de reposición (${Math.ceil(reorderPoint ?? 0)} unidades).` : `Compra para cubrir ${options.horizonDays} días de demanda estimada.`)
        : (options.mode === "reorder" ? "La existencia cubre el punto de reposición." : "La existencia cubre el horizonte estimado.");
      return { product, dailyDemand: demand, reorderPoint, suggestedQuantity: quantity, lineCost: quantity * product.costPrice, reason, insufficientData: false };
    });
  },
};
