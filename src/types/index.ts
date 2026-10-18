/**
 * Modelos de dominio del sistema de gestión de EPP/EPI.
 * Estas interfaces reflejan las entidades que existirán en el backend futuro
 * (products, equipment, categories, manufacturers, inspections, maintenance,
 * assignments, equipment_history, documents, users, roles).
 */

export type EquipmentStatus =
  | "activo"
  | "disponible"
  | "asignado"
  | "en_inspeccion"
  | "mantenimiento"
  | "proximo_vencer"
  | "vencido"
  | "fuera_servicio"
  | "retirado";

export type ProductStatus = "activo" | "descontinuado" | "borrador";

export type InspectionResult =
  | "aprobado"
  | "aprobado_con_observaciones"
  | "rechazado"
  | "pendiente";

export type RoleName = "administrador" | "supervisor" | "inspector" | "tecnico" | "usuario";

export type DocumentType =
  | "manual"
  | "ficha_tecnica"
  | "certificado"
  | "declaracion_conformidad"
  | "otro";

export interface Role {
  id: string;
  name: RoleName;
  label: string;
  description: string;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: RoleName;
  status: "activo" | "inactivo" | "suspendido";
  lastAccess: string;
  location?: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  status: "activa" | "inactiva";
  order: number;
}

export interface Manufacturer {
  id: string;
  name: string;
  country: string;
  website?: string;
}

export interface EquipmentImage {
  id: string;
  url: string;
  alt: string;
  isPrimary: boolean;
}

export interface TechnicalDocument {
  id: string;
  productId?: string;
  equipmentId?: string;
  type: DocumentType;
  title: string;
  fileUrl: string;
  fileSize: string;
  version: string;
  updatedAt: string;
}

export interface SpecItem {
  label: string;
  value: string;
}

export interface Product {
  id: string;
  name: string;
  code: string;
  sku: string;
  categoryId: string;
  manufacturerId: string;
  model: string;
  description: string;
  features: string[];
  specifications: SpecItem[];
  materials: string[];
  weight: string;
  dimensions: string;
  standards: string[];
  certifications: string[];
  serviceLife: string;
  usage: string;
  equipmentType: string;
  warnings: string[];
  images: EquipmentImage[];
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Equipment {
  id: string;
  internalCode: string;
  serialNumber: string;
  productId: string;
  status: EquipmentStatus;
  manufacturingDate: string;
  purchaseDate: string;
  commissioningDate: string;
  location: string;
  assignedUserId?: string;
  lastInspectionDate?: string;
  nextInspectionDate?: string;
  serviceLife: string;
  notes?: string;
  qrCode: string;
  /** Código leído del Data Matrix físico; opcional porque puede coincidir con el número de serie. */
  dataMatrixCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Inspection {
  id: string;
  equipmentId: string;
  inspectorId: string;
  date: string;
  result: InspectionResult;
  observations: string;
  recommendations?: string;
  nextInspectionDate: string;
  photos: string[];
}

export interface InspectionDraft {
  equipmentId: string;
  inspectorId: string;
  date: string;
  result: InspectionResult;
  observations: string;
  recommendations: string;
  photos: string[];
}

export interface EquipmentAssignment {
  id: string;
  equipmentId: string;
  userId: string;
  assignedAt: string;
  returnedAt?: string;
  location: string;
}

export interface EquipmentMaintenance {
  id: string;
  equipmentId: string;
  date: string;
  type: "preventivo" | "correctivo" | "limpieza";
  description: string;
  responsibleId: string;
}

export type HistoryEventType =
  | "inspeccion"
  | "asignacion"
  | "ubicacion"
  | "mantenimiento"
  | "estado"
  | "alta";

export interface EquipmentHistory {
  id: string;
  equipmentId: string;
  date: string;
  type: HistoryEventType;
  title: string;
  detail: string;
  actor: string;
}

export interface InventorySummary {
  productId: string;
  productCode: string;
  productName: string;
  categoryId: string;
  total: number;
  available: number;
  assigned: number;
  maintenance: number;
  outOfService: number;
}

export interface Report {
  id: string;
  name: string;
  description: string;
  rows: number;
  updatedAt: string;
}

export interface AlertItem {
  id: string;
  severity: "info" | "warning" | "danger";
  title: string;
  message: string;
  equipmentCode?: string;
}

export interface DashboardMetrics {
  total: number;
  active: number;
  inInspection: number;
  expiringSoon: number;
  expired: number;
  outOfService: number;
}


export interface WarehouseProduct {
  id: string;
  productId: string;
  sku: string;
  name: string;
  description?: string;
  image: string;
  quantity: number;
  minStock: number;
  costPrice: number;
  salePrice: number;
  location: string;
  supplier?: string;
  /** Parámetros de reposición; la demanda es una estimación manual hasta integrar ventas reales. */
  leadTimeDays?: number;
  safetyStock?: number;
  maxStock?: number | undefined;
  minPurchaseQuantity?: number | undefined;
  purchaseMultiple?: number | undefined;
  dailyDemandEstimate?: number | undefined;
  demandEstimateNotes?: string | undefined;
  currency?: "HNL" | "USD" | "EUR" | undefined;
  active: boolean;
  updatedAt: string;
}

export interface QuoteItem {
  warehouseProductId: string;
  quantity: number;
  unitPrice: number;
}

export interface QuoteCompanyProfile {
  name: string;
  address: string;
  phone: string;
  email: string;
  logoDataUrl?: string;
}

export interface QuoteCustomer {
  companyName: string;
  contactName: string;
  place: string;
  date: string;
  notes?: string;
}

export type SalePaymentMethod = "efectivo" | "transferencia" | "tarjeta" | "credito" | "otro";
export interface SaleLine {
  warehouseProductId: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  lineTotal: number;
}
export interface SaleRecord {
  id: string;
  saleNumber: string;
  soldAt: string;
  customerName: string;
  customerContact: string;
  paymentMethod: SalePaymentMethod;
  notes: string;
  lines: SaleLine[];
  subtotal: number;
  discount: number;
  total: number;
  status: "completed";
  createdBy: string;
}
