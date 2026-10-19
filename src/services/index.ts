/**
 * Capa de servicios del frontend.
 *
 * En desarrollo usa datos de demostración; en producción consulta la API de Netlify
 * y PostgreSQL. Las conversiones de tipos se centralizan aquí para que el frontend
 * reciba los modelos de dominio independientemente de cómo pg devuelva los datos.
 *
 *   Frontend -> Servicios -> API de Netlify -> PostgreSQL
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

function asRecord(value: unknown): Record<string, unknown> { return value && typeof value === 'object' ? value as Record<string, unknown> : {}; }
function pick(record: Record<string, unknown>, ...keys: string[]): unknown {
  for (const key of keys) if (record[key] !== undefined && record[key] !== null) return record[key];
  return undefined;
}
function stringValue(value: unknown, fallback = ''): string { return typeof value === 'string' ? value : value === null || value === undefined ? fallback : String(value); }
function numberValue(value: unknown, fallback = 0): number { const parsed = typeof value === 'number' ? value : Number(value); return Number.isFinite(parsed) ? parsed : fallback; }
function arrayValue<T>(value: unknown, fallback: T[] = []): T[] {
  if (Array.isArray(value)) return value as T[];
  if (typeof value === 'string') { try { const parsed: unknown = JSON.parse(value); return Array.isArray(parsed) ? parsed as T[] : fallback; } catch { return fallback; } }
  return fallback;
}
function mapProduct(value: unknown): Product {
  const r = asRecord(value);
  const rawImages = arrayValue<Record<string, unknown>>(r['images']);
  const imageUrl = stringValue(pick(r, 'image', 'image_url', 'imageUrl', 'warehouse_image', 'warehouseImage'));
  const images = rawImages.map((image, index) => ({
    id: stringValue(pick(image, 'id'), `${stringValue(r['id'])}-image-${index}`),
    url: stringValue(pick(image, 'url', 'image_url', 'imageUrl')),
    alt: stringValue(pick(image, 'alt', 'alt_text', 'altText'), stringValue(r['name'])),
    isPrimary: Boolean(pick(image, 'isPrimary', 'is_primary')),
  })).filter(image => image.url);
  if (!images.length && imageUrl) images.push({ id: `${stringValue(r['id'])}-primary`, url: imageUrl, alt: stringValue(r['name']), isPrimary: true });
  const statusText = stringValue(r['status'], 'activo').toLowerCase();
  return {
    id: stringValue(r['id']), name: stringValue(r['name']), code: stringValue(pick(r, 'code', 'sku')),
    sku: stringValue(pick(r, 'sku', 'code')), categoryId: stringValue(pick(r, 'categoryId', 'category_id')),
    manufacturerId: stringValue(pick(r, 'manufacturerId', 'manufacturer_id')), model: stringValue(r['model']),
    description: stringValue(r['description']), features: arrayValue<string>(pick(r, 'features', 'features_json')),
    specifications: arrayValue<import('@/types').SpecItem>(pick(r, 'specifications', 'specifications_json')),
    materials: arrayValue<string>(pick(r, 'materials')), weight: stringValue(r['weight']), dimensions: stringValue(r['dimensions']),
    standards: arrayValue<string>(pick(r, 'standards', 'standards_json')), certifications: arrayValue<string>(pick(r, 'certifications', 'certifications_json')),
    serviceLife: stringValue(pick(r, 'serviceLife', 'service_life')), usage: stringValue(r['usage']),
    equipmentType: stringValue(pick(r, 'equipmentType', 'equipment_type')), warnings: arrayValue<string>(pick(r, 'warnings', 'warnings_json')),
    images, status: statusText === 'descontinuado' || statusText === 'discontinued' || statusText === 'inactivo' ? 'descontinuado' : statusText === 'borrador' ? 'borrador' : 'activo',
    createdAt: stringValue(pick(r, 'createdAt', 'created_at')), updatedAt: stringValue(pick(r, 'updatedAt', 'updated_at')),
  };
}
function mapCategory(value: unknown): Category {
  const r = asRecord(value);
  const status = stringValue(r['status'], 'activa').toLowerCase();
  return { id: stringValue(r['id']), name: stringValue(r['name']), slug: stringValue(r['slug']), description: stringValue(r['description']), image: stringValue(pick(r, 'image', 'image_url', 'imageUrl', 'warehouse_image', 'warehouseImage')), status: ['inactiva','inactive','false','0'].includes(status) ? 'inactiva' : 'activa', order: numberValue(pick(r, 'order','sort_order','sortOrder')) };
}
function mapManufacturer(value: unknown): Manufacturer {
  const r = asRecord(value);
  const website = stringValue(r['website']);
  return { id: stringValue(r['id']), name: stringValue(r['name']), country: stringValue(r['country']), ...(website ? { website } : {}) };
}
function mapEquipment(value: unknown): Equipment {
  const r = asRecord(value);
  return {
    id: stringValue(r['id']), internalCode: stringValue(pick(r,'internalCode','internal_code')),
    serialNumber: stringValue(pick(r,'serialNumber','serial_number')), productId: stringValue(pick(r,'productId','product_id')),
    status: stringValue(r['status'], 'disponible') as Equipment['status'], manufacturingDate: stringValue(pick(r,'manufacturingDate','manufacturing_date')),
    purchaseDate: stringValue(pick(r,'purchaseDate','purchase_date')), commissioningDate: stringValue(pick(r,'commissioningDate','commissioning_date')),
    location: stringValue(r['location']), ...(pick(r,'assignedUserId','assigned_user_id') ? { assignedUserId: stringValue(pick(r,'assignedUserId','assigned_user_id')) } : {}),
    ...(pick(r,'lastInspectionDate','last_inspection_date') ? { lastInspectionDate: stringValue(pick(r,'lastInspectionDate','last_inspection_date')) } : {}),
    ...(pick(r,'nextInspectionDate','next_inspection_date') ? { nextInspectionDate: stringValue(pick(r,'nextInspectionDate','next_inspection_date')) } : {}),
    serviceLife: stringValue(pick(r,'serviceLife','service_life')), ...(r['notes'] ? { notes: stringValue(r['notes']) } : {}),
    qrCode: stringValue(pick(r,'qrCode','qr_code')), ...(pick(r,'dataMatrixCode','data_matrix_code') ? { dataMatrixCode: stringValue(pick(r,'dataMatrixCode','data_matrix_code')) } : {}),
    createdAt: stringValue(pick(r,'createdAt','created_at')), updatedAt: stringValue(pick(r,'updatedAt','updated_at')),
  };
}
function mapInspection(value: unknown): Inspection {
  const r = asRecord(value);
  return { id: stringValue(r['id']), equipmentId: stringValue(pick(r,'equipmentId','equipment_id')), inspectorId: stringValue(pick(r,'inspectorId','inspector_id')),
    date: stringValue(pick(r,'date','inspectionDate','inspection_date','created_at')), result: stringValue(r['result'],'pendiente') as Inspection['result'],
    observations: stringValue(r['observations']), ...(r['recommendations'] ? { recommendations: stringValue(r['recommendations']) } : {}),
    nextInspectionDate: stringValue(pick(r,'nextInspectionDate','next_inspection_date')), photos: arrayValue<string>(r['photos']) };
}
function mapUser(value: unknown): User {
  const r = asRecord(value);
  return { id: stringValue(r['id']), fullName: stringValue(pick(r,'fullName','full_name')), email: stringValue(r['email']), role: stringValue(r['role'],'usuario') as User['role'],
    status: stringValue(r['status'],'activo') as User['status'], lastAccess: stringValue(pick(r,'lastAccess','last_access_at')), ...(pick(r,'location') ? { location: stringValue(r['location']) } : {}), createdAt: stringValue(pick(r,'createdAt','created_at')) };
}
function mapDocument(value: unknown): TechnicalDocument {
  const r = asRecord(value);
  return { id: stringValue(r['id']), ...(pick(r,'productId','product_id') ? { productId: stringValue(pick(r,'productId','product_id')) } : {}),
    ...(pick(r,'equipmentId','equipment_id') ? { equipmentId: stringValue(pick(r,'equipmentId','equipment_id')) } : {}),
    type: stringValue(r['type'],'otro') as TechnicalDocument['type'], title: stringValue(r['title']), fileUrl: stringValue(pick(r,'fileUrl','file_url')),
    fileSize: stringValue(pick(r,'fileSize','file_size')), version: stringValue(r['version']), updatedAt: stringValue(pick(r,'updatedAt','updated_at')) };
}
function mapWarehouseProduct(value: unknown): WarehouseProduct {
  const r = asRecord(value);
  const currencyText = stringValue(r['currency'], 'HNL');
  const maxStock = pick(r,'maxStock','max_stock');
  const minPurchase = pick(r,'minPurchaseQuantity','min_purchase_quantity');
  const purchaseMultiple = pick(r,'purchaseMultiple','purchase_multiple');
  const demand = pick(r,'dailyDemandEstimate','daily_demand_estimate');
  const lead = pick(r,'leadTimeDays','lead_time_days');
  const safety = pick(r,'safetyStock','safety_stock');
  return {
    id: stringValue(r['id']), productId: stringValue(pick(r,'productId','product_id')),
    sku: stringValue(r['sku']), name: stringValue(r['name']), description: stringValue(r['description']),
    image: stringValue(pick(r,'image','image_url')), quantity: numberValue(r['quantity']), minStock: numberValue(pick(r,'minStock','min_stock')),
    costPrice: numberValue(pick(r,'costPrice','cost_price')), salePrice: numberValue(pick(r,'salePrice','sale_price')),
    location: stringValue(r['location']), supplier: stringValue(r['supplier']),
    ...(lead !== undefined && lead !== null ? { leadTimeDays: numberValue(lead) } : {}),
    ...(safety !== undefined && safety !== null ? { safetyStock: numberValue(safety) } : {}),
    ...(maxStock !== undefined && maxStock !== null ? { maxStock: numberValue(maxStock) } : {}),
    ...(minPurchase !== undefined && minPurchase !== null ? { minPurchaseQuantity: numberValue(minPurchase) } : {}),
    ...(purchaseMultiple !== undefined && purchaseMultiple !== null ? { purchaseMultiple: numberValue(purchaseMultiple) } : {}),
    ...(demand !== undefined && demand !== null ? { dailyDemandEstimate: numberValue(demand) } : {}),
    ...(pick(r,'demandEstimateNotes','demand_estimate_notes') !== undefined ? { demandEstimateNotes: stringValue(pick(r,'demandEstimateNotes','demand_estimate_notes')) } : {}),
    currency: (['HNL','USD','EUR'].includes(currencyText) ? currencyText : 'HNL') as WarehouseProduct['currency'],
    active: r['active'] === undefined ? true : r['active'] === true || r['active'] === 'true',
    updatedAt: stringValue(pick(r,'updatedAt','updated_at')).slice(0,10) || new Date().toISOString().slice(0,10),
  };
}


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

export const productService = {
  async getProducts(filters: ProductFilters = {}): Promise<Product[]> {
    const source = import.meta.env.DEV ? clone(mockProducts) : (await warehouseApi<unknown[]>('/products')).map(mapProduct);
    let list = source;
    const q = filters.search?.trim().toLowerCase();
    if (q) list = list.filter((p) => [p.name,p.code,p.model,p.sku,p.equipmentType].some((f) => f.toLowerCase().includes(q)));
    if (filters.categoryId) list = list.filter((p) => p.categoryId === filters.categoryId);
    if (filters.manufacturerId) list = list.filter((p) => p.manufacturerId === filters.manufacturerId);
    if (filters.equipmentType) list = list.filter((p) => p.equipmentType === filters.equipmentType);
    if (filters.status) list = list.filter((p) => p.status === filters.status);
    if (filters.usage) list = list.filter((p) => p.usage === filters.usage);
    if (filters.standard) list = list.filter((p) => p.standards.includes(filters.standard!));
    switch (filters.sort) {
      case 'codigo': list.sort((a,b) => a.code.localeCompare(b.code)); break;
      case 'categoria': list.sort((a,b) => a.categoryId.localeCompare(b.categoryId)); break;
      case 'reciente': list.sort((a,b) => b.updatedAt.localeCompare(a.updatedAt)); break;
      default: list.sort((a,b) => a.name.localeCompare(b.name));
    }
    return list;
  },
  async getProductById(id: string): Promise<Product | undefined> { return (await this.getProducts()).find(p => p.id === id); },
  async getProductByCode(code: string): Promise<Product | undefined> { return (await this.getProducts()).find(p => p.code.toLowerCase() === code.toLowerCase() || p.sku.toLowerCase() === code.toLowerCase()); },
  async getFilterOptions() {
    const products = await this.getProducts();
    return { equipmentTypes: [...new Set(products.map(p => p.equipmentType).filter(Boolean))].sort(), usages: [...new Set(products.map(p => p.usage).filter(Boolean))].sort(), standards: [...new Set(products.flatMap(p => p.standards))].sort() };
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
    let list = import.meta.env.DEV ? clone(readLocal(EQUIPMENT_KEY, mockEquipment)) : (await warehouseApi<unknown[]>('/equipment')).map(mapEquipment);
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
    return import.meta.env.DEV ? delay(clone(readLocal(EQUIPMENT_KEY, mockEquipment).find((e) => e.id === id))) : (await this.getEquipment()).find(e => e.id === id);
  },
  async getEquipmentByInternalCode(code: string): Promise<Equipment | undefined> {
    return (await this.getEquipment()).find(e => e.internalCode.toLowerCase() === code.toLowerCase());
  },
  async getEquipmentBySerialNumber(serial: string): Promise<Equipment | undefined> {
    return (await this.getEquipment()).find(e => e.serialNumber.toLowerCase() === serial.toLowerCase());
  },
  /**
   * Busca una unidad a partir de cualquier código leído por cámara.
   * Soporta payloads internos, URLs y números de serie (incluido Data Matrix de Petzl).
   */
  async getEquipmentByScanCode(code: string): Promise<Equipment | undefined> {
    const normalized = codeService.parse(code);
    if (!normalized) return delay(undefined);
    const items = await this.getEquipment();
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
    if (!import.meta.env.DEV) { const rows = await warehouseApi<unknown[]>(`/equipment/history?equipmentId=${encodeURIComponent(equipmentId)}`); return rows.map(value => { const r=asRecord(value); return { id:stringValue(r['id']), equipmentId:stringValue(pick(r,'equipmentId','equipment_id')), date:stringValue(pick(r,'date','event_date','created_at')), type:stringValue(pick(r,'type','event_type'),'estado') as EquipmentHistory['type'], title:stringValue(r['title']), detail:stringValue(r['detail']), actor:stringValue(pick(r,'actor','actor_email','actor_user_id')) }; }); }
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
    const items = await this.getEquipment();
    return [...new Set(items.map((e) => e.location))].sort();
  },
  async upsertEquipment(item: Equipment): Promise<Equipment> {
    if (!import.meta.env.DEV) {
      const exists = await this.getEquipmentById(item.id);
      const saved = await warehouseApi<unknown>(exists ? `/equipment/${encodeURIComponent(item.id)}` : '/equipment', { method: exists ? 'PUT' : 'POST', body: JSON.stringify(item) });
      return mapEquipment(saved);
    }
    const items = readLocal(EQUIPMENT_KEY, mockEquipment); const index = items.findIndex((x) => x.id === item.id);
    if (index >= 0) items[index] = item; else items.unshift(item); writeLocal(EQUIPMENT_KEY, items); return delay(clone(item));
  },
  async deleteEquipment(id: string): Promise<boolean> {
    if (!import.meta.env.DEV) { await warehouseApi(`/equipment/${encodeURIComponent(id)}`, { method: 'DELETE' }); return true; }
    const items = readLocal(EQUIPMENT_KEY, mockEquipment).filter((x) => x.id !== id); writeLocal(EQUIPMENT_KEY, items); return delay(true);
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
  async getCategories(): Promise<Category[]> { return import.meta.env.DEV ? delay(clone(mockCategories).sort((a,b)=>a.order-b.order)) : (await warehouseApi<unknown[]>('/categories')).map(mapCategory); },
  async getCategoryBySlug(slug: string): Promise<Category | undefined> { return (await this.getCategories()).find(c => c.slug === slug); },
  async getManufacturers(): Promise<Manufacturer[]> { return import.meta.env.DEV ? delay(clone(mockManufacturers)) : (await warehouseApi<unknown[]>('/manufacturers')).map(mapManufacturer); },
};

export const inspectionService = {
  async getInspections(): Promise<Inspection[]> { return import.meta.env.DEV ? delay(clone(mockInspections).sort((a,b)=>b.date.localeCompare(a.date))) : (await warehouseApi<unknown[]>('/inspections')).map(mapInspection); },
  async getInspectionsByEquipment(equipmentId: string): Promise<Inspection[]> { return import.meta.env.DEV ? delay(clone(mockInspections.filter(i=>i.equipmentId===equipmentId))) : (await warehouseApi<unknown[]>(`/inspections?equipmentId=${encodeURIComponent(equipmentId)}`)).map(mapInspection); },
  async registerInspection(draft: InspectionDraft): Promise<{ ok: true; draft: InspectionDraft }> {
    if (!import.meta.env.DEV) { const saved = await warehouseApi<unknown>('/inspections',{method:'POST',body:JSON.stringify(draft)}); return {ok:true,draft:{...draft,...(asRecord(saved) as unknown as Partial<InspectionDraft>)}}; }
    return delay({ok:true as const,draft},400);
  },
};

export const inventoryService = {
  async getInventory(): Promise<InventorySummary[]> {
    const [products,equipment] = await Promise.all([productService.getProducts(),equipmentService.getEquipment()]);
    return products.map(product => { const units=equipment.filter(e=>e.productId===product.id); return { productId:product.id, productCode:product.code, productName:product.name, categoryId:product.categoryId, total:units.length,
      available:units.filter(u=>u.status==='disponible'||u.status==='activo').length, assigned:units.filter(u=>u.status==='asignado').length,
      maintenance:units.filter(u=>u.status==='mantenimiento'||u.status==='en_inspeccion').length, outOfService:units.filter(u=>u.status==='fuera_servicio'||u.status==='vencido'||u.status==='retirado').length }; }).filter(item=>item.total>0);
  },
};

export const userService = {
  async getUsers(): Promise<User[]> { return import.meta.env.DEV ? delay(clone(mockUsers)) : (await warehouseApi<unknown[]>('/users')).map(mapUser); },
  async getUserById(id: string): Promise<User | undefined> { return (await this.getUsers()).find(u=>u.id===id); },
  async getRoles(): Promise<Role[]> {
    if (import.meta.env.DEV) return delay(clone(mockRoles));
    return (await warehouseApi<unknown[]>('/roles')).map(value=>{ const r=asRecord(value); const name=stringValue(r['name'],'usuario') as Role['name']; return {id:stringValue(r['id']),name,label:stringValue(pick(r,'label','display_name'),name),description:stringValue(r['description'])}; });
  },
};

export const documentService = {
  async getDocumentsByProduct(productId: string): Promise<TechnicalDocument[]> { return import.meta.env.DEV ? delay(clone(mockDocuments.filter(d=>d.productId===productId))) : (await warehouseApi<unknown[]>(`/documents?productId=${encodeURIComponent(productId)}`)).map(mapDocument); },
  async getAllDocuments(): Promise<TechnicalDocument[]> { return import.meta.env.DEV ? delay(clone(mockDocuments)) : (await warehouseApi<unknown[]>('/documents')).map(mapDocument); },
};

export const reportService = {
  async getReports(): Promise<Report[]> {
    if (import.meta.env.DEV) return delay(clone(mockReports));
    return (await warehouseApi<unknown[]>('/reports')).map(value => { const r=asRecord(value); return { id:stringValue(r['id']), name:stringValue(r['name']), description:stringValue(r['description']), rows:numberValue(r['rows']), updatedAt:stringValue(pick(r,'updatedAt','updated_at')) }; });
  },
  async export(reportId: string, format: "excel" | "pdf") {
    if (import.meta.env.DEV) return delay({ ok: true as const, reportId, format, demo: true }, 300);
    const payload = await warehouseApi<{ reportId: string; rows: Record<string, unknown>[] }>(`/reports/${encodeURIComponent(reportId)}/export`);
    const rows = payload.rows ?? [];
    const columns = [...new Set(rows.flatMap(row => Object.keys(row)))].filter(key => !['image','image_url','token_hash'].includes(key));
    const cell = (value: unknown) => {
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') return JSON.stringify(value);
      return String(value);
    };
    if (format === 'excel') {
      const quoteCsv = (value: unknown) => `"${cell(value).replace(/"/g,'""')}"`;
      const csv = '\uFEFF' + [columns.map(quoteCsv).join(','), ...rows.map(row => columns.map(column => quoteCsv(row[column])).join(','))].join('\r\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); const url = URL.createObjectURL(blob); const anchor = document.createElement('a');
      anchor.href = url; anchor.download = `epi-${reportId}-${new Date().toISOString().slice(0,10)}.csv`; document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url);
      return { ok: true as const, reportId, format };
    }
    const escapeHtml = (value: unknown) => cell(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
    const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Reporte EPIControl</title><style>body{font:12px Arial,sans-serif;padding:24px;color:#111}h1{font-size:20px}p{color:#555}table{width:100%;border-collapse:collapse}th,td{border:1px solid #bbb;padding:6px;text-align:left;vertical-align:top;word-break:break-word}th{background:#eee}@media print{body{padding:0}tr{break-inside:avoid}}</style></head><body><h1>Reporte EPIControl: ${escapeHtml(reportId)}</h1><p>Generado: ${escapeHtml(new Date().toLocaleString('es-HN'))} · Registros: ${rows.length}</p><table><thead><tr>${columns.map(column=>`<th>${escapeHtml(column)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${columns.map(column=>`<td>${escapeHtml(row[column])}</td>`).join('')}</tr>`).join('')}</tbody></table><script>window.onload=()=>window.print()</script></body></html>`;
    const printWindow = window.open('', '_blank');
    if (!printWindow) throw new Error('El navegador bloqueó la ventana del reporte. Permite las ventanas emergentes y vuelve a intentarlo.');
    printWindow.document.open(); printWindow.document.write(html); printWindow.document.close();
    return { ok: true as const, reportId, format };
  },
};

export const dashboardService = {
  async getMetrics(): Promise<DashboardMetrics> {
    const equipment = await equipmentService.getEquipment(); const s=(status:string)=>equipment.filter(e=>e.status===status).length;
    return {total:equipment.length,active:s('activo')+s('asignado')+s('disponible'),inInspection:s('en_inspeccion')+s('mantenimiento'),expiringSoon:s('proximo_vencer'),expired:s('vencido'),outOfService:s('fuera_servicio')+s('retirado')};
  },
  async getByCategory() {
    const [categories,products,equipment] = await Promise.all([categoryService.getCategories(),productService.getProducts(),equipmentService.getEquipment()]);
    return categories.map(category=>({name:category.name,total:equipment.filter(e=>products.find(p=>p.id===e.productId)?.categoryId===category.id).length})).filter(item=>item.total>0);
  },
  async getUpcomingInspections() {
    const equipment=await equipmentService.getEquipment(); const buckets=[{name:'0-7 días',total:0},{name:'8-15 días',total:0},{name:'16-30 días',total:0},{name:'31-90 días',total:0}]; const today=new Date(); today.setHours(0,0,0,0);
    equipment.forEach(e=>{if(!e.nextInspectionDate)return; const date=new Date(e.nextInspectionDate); if(Number.isNaN(date.getTime()))return; const diff=Math.round((date.getTime()-today.getTime())/86400000); if(diff<0)return; if(diff<=7)buckets[0]!.total++;else if(diff<=15)buckets[1]!.total++;else if(diff<=30)buckets[2]!.total++;else if(diff<=90)buckets[3]!.total++;}); return buckets;
  },
  async getAlerts(): Promise<AlertItem[]> {
    const [equipment,products]=await Promise.all([equipmentService.getEquipment(),productService.getProducts()]); const alerts:AlertItem[]=[];
    equipment.forEach(e=>{const product=products.find(p=>p.id===e.productId); const label=`${product?.name??'Equipo'} · ${e.internalCode}`;
      if(e.status==='vencido')alerts.push({id:`al-${e.id}`,severity:'danger',title:'Inspección vencida',message:`${label} tiene la inspección vencida desde ${e.nextInspectionDate}.`,equipmentCode:e.internalCode});
      else if(e.status==='fuera_servicio')alerts.push({id:`al-${e.id}`,severity:'danger',title:'Equipo fuera de servicio',message:`${label} está bloqueado: ${e.notes??'revisar ficha del equipo'}.`,equipmentCode:e.internalCode});
      else if(e.status==='proximo_vencer')alerts.push({id:`al-${e.id}`,severity:'warning',title:'Inspección próxima',message:`${label} debe inspeccionarse el ${e.nextInspectionDate}.`,equipmentCode:e.internalCode});}); return alerts;
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
    const q=query.trim().toLowerCase(); if(q.length<2)return [];
    const [equipment,products,categories,users]=await Promise.all([equipmentService.getEquipment(),productService.getProducts(),categoryService.getCategories(),userService.getUsers()]);
    const results:GlobalSearchResult[]=[];
    equipment.filter(e=>`${e.internalCode} ${e.serialNumber}`.toLowerCase().includes(q)).slice(0,6).forEach(e=>{const product=products.find(p=>p.id===e.productId);results.push({id:e.id,type:'equipo',title:`${e.internalCode} · ${product?.name??''}`,subtitle:`Serie ${e.serialNumber} — ${e.status.replace(/_/g,' ')}`,to:'/equipos/unidad/$internalCode',params:{internalCode:e.internalCode}});});
    products.filter(p=>`${p.name} ${p.code} ${p.model}`.toLowerCase().includes(q)).slice(0,6).forEach(p=>results.push({id:p.id,type:'producto',title:p.name,subtitle:`${p.code} — ${p.equipmentType}`,to:'/productos/$productCode',params:{productCode:p.code}}));
    categories.filter(c=>c.name.toLowerCase().includes(q)).slice(0,4).forEach(c=>results.push({id:c.id,type:'categoria',title:c.name,subtitle:'Categoría del catálogo',to:'/categorias'}));
    users.filter(u=>`${u.fullName} ${u.email}`.toLowerCase().includes(q)).slice(0,4).forEach(u=>results.push({id:u.id,type:'usuario',title:u.fullName,subtitle:`${u.email} — ${u.role}`,to:'/admin/usuarios'}));
    return results;
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

async function warehouseApi<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`/.netlify/functions/api${path}`, { ...init, credentials: "same-origin", headers: { "content-type": "application/json", ...(init.headers ?? {}) } });
  const payload = await response.json().catch(() => ({})) as { data?: T; error?: string };
  if (!response.ok) throw new Error(payload.error || `Error del servidor (${response.status}).`);
  return (payload.data ?? payload) as T;
}

export const warehouseService = {
  async getProducts(): Promise<WarehouseProduct[]> {
    if (import.meta.env.DEV) return delay(clone(readLocal(WAREHOUSE_KEY, mockWarehouseProducts)));
    return (await warehouseApi<unknown[]>("/warehouse-products")).map(mapWarehouseProduct);
  },
  async saveProducts(items: WarehouseProduct[]) {
    if (import.meta.env.DEV) { writeLocal(WAREHOUSE_KEY, items); return delay(clone(items)); }
    const saved: WarehouseProduct[] = [];
    for (const item of items) saved.push(await this.upsertProduct(item));
    return saved;
  },
  async upsertProduct(item: WarehouseProduct): Promise<WarehouseProduct> {
    if (import.meta.env.DEV) {
      const items = readLocal(WAREHOUSE_KEY, mockWarehouseProducts);
      const index = items.findIndex((x) => x.id === item.id);
      if (index >= 0) items[index] = item; else items.unshift(item);
      writeLocal(WAREHOUSE_KEY, items);
      return delay(clone(item));
    }
    return mapWarehouseProduct(await warehouseApi<unknown>("/warehouse-products", { method: "POST", body: JSON.stringify(item) }));
  },
  async deleteProduct(id: string): Promise<boolean> {
    if (import.meta.env.DEV) {
      const items = readLocal(WAREHOUSE_KEY, mockWarehouseProducts).filter((x) => x.id !== id);
      writeLocal(WAREHOUSE_KEY, items);
      return delay(true);
    }
    await warehouseApi<{ ok: true }>(`/warehouse-products/${encodeURIComponent(id)}`, { method: "DELETE" });
    return true;
  },
};

export const quoteService = {
  async getProfile(): Promise<QuoteCompanyProfile> {
    const fallback: QuoteCompanyProfile = { name: "Vertical Safety", address: "", phone: "", email: "", logoDataUrl: "/vertical-safety-logo.png" };
    if (import.meta.env.DEV) return delay(readLocal(PROFILE_KEY, fallback));
    return warehouseApi<QuoteCompanyProfile>('/settings/quote-company').catch(() => fallback);
  },
  async saveProfile(profile: QuoteCompanyProfile) { if (import.meta.env.DEV) { writeLocal(PROFILE_KEY, profile); return delay(profile); } return warehouseApi<QuoteCompanyProfile>('/settings/quote-company',{method:'PUT',body:JSON.stringify({profile})}); },
  async buildQuote(customer: QuoteCustomer, items: { product: WarehouseProduct; quantity: number; unitPrice: number }[]) {
    return delay({ customer, items, subtotal: items.reduce((sum, x) => sum + x.quantity * x.unitPrice, 0) });
  },
  async saveQuote(customer: QuoteCustomer, items: { product: WarehouseProduct; quantity: number; unitPrice: number }[]) {
    if (!items.length) throw new Error('Agrega al menos un producto a la cotización.');
    if (import.meta.env.DEV) return delay({ ok: true as const, demo: true, customer, items });
    return warehouseApi<Record<string, unknown>>('/quotes', { method: 'POST', body: JSON.stringify({ customer, items: items.map(item => ({ warehouseProductId: item.product.id, quantity: item.quantity, unitPrice: item.unitPrice })) }) });
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
    if (!import.meta.env.DEV) return (await warehouseApi<unknown[]>('/sales')).map(value=>{const r=asRecord(value); const lines=arrayValue<Record<string,unknown>>(r['lines']).map(line=>({warehouseProductId:stringValue(pick(line,'warehouseProductId','warehouse_product_id')),sku:stringValue(line['sku']),name:stringValue(line['name']),quantity:numberValue(line['quantity']),unitPrice:numberValue(pick(line,'unitPrice','unit_price')),unitCost:numberValue(pick(line,'unitCost','unit_cost')),lineTotal:numberValue(pick(line,'lineTotal','line_total'))})); return {id:stringValue(r['id']),saleNumber:stringValue(pick(r,'saleNumber','sale_number')),soldAt:stringValue(pick(r,'soldAt','sold_at','created_at')),customerName:stringValue(pick(r,'customerName','customer_name')),customerContact:stringValue(pick(r,'customerContact','customer_contact')),paymentMethod:stringValue(pick(r,'paymentMethod','payment_method'),'otro') as SalePaymentMethod,notes:stringValue(r['notes']),lines,subtotal:numberValue(r['subtotal']),discount:numberValue(r['discount']),total:numberValue(r['total']),status:'completed' as const,createdBy:stringValue(pick(r,'createdBy','created_by'))}; });
    return delay(clone(readLocal<SaleRecord[]>(SALES_KEY, [])));
  },
  async registerSale(draft: SaleDraft): Promise<SaleRecord> {
    if (!import.meta.env.DEV) {
      if (!draft.lines.length) throw new Error('Agrega al menos un producto al carrito.');
      const saved = await warehouseApi<unknown>('/sales',{method:'POST',body:JSON.stringify(draft)});
      const r=asRecord(saved); const lines=arrayValue<Record<string,unknown>>(r['lines']).map(line=>({warehouseProductId:stringValue(pick(line,'warehouseProductId','warehouse_product_id')),sku:stringValue(line['sku']),name:stringValue(line['name']),quantity:numberValue(line['quantity']),unitPrice:numberValue(pick(line,'unitPrice','unit_price')),unitCost:numberValue(pick(line,'unitCost','unit_cost')),lineTotal:numberValue(pick(line,'lineTotal','line_total'))}));
      return {id:stringValue(r['id']),saleNumber:stringValue(pick(r,'saleNumber','sale_number')),soldAt:stringValue(pick(r,'soldAt','sold_at','created_at')),customerName:stringValue(pick(r,'customerName','customer_name')),customerContact:stringValue(pick(r,'customerContact','customer_contact')),paymentMethod:stringValue(pick(r,'paymentMethod','payment_method'),'otro') as SalePaymentMethod,notes:stringValue(r['notes']),lines,subtotal:numberValue(r['subtotal']),discount:numberValue(r['discount']),total:numberValue(r['total']),status:'completed',createdBy:stringValue(pick(r,'createdBy','created_by'))};
    }
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
