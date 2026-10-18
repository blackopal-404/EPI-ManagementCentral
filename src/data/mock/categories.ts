import type { Category, Manufacturer, Role } from "@/types";
import harness from "@/assets/epp-harness.jpg";
import helmet from "@/assets/epp-helmet.jpg";
import rope from "@/assets/epp-rope.jpg";
import respiratory from "@/assets/epp-respiratory.jpg";

export const categoryImages = { harness, helmet, rope, respiratory };

const demoCategories: Category[] = [
  {
    id: "cat-01",
    name: "Trabajo en alturas",
    slug: "trabajo-en-alturas",
    description: "Arneses, líneas de vida, eslingas y equipos anticaídas para trabajo vertical.",
    image: harness,
    status: "activa",
    order: 1,
  },
  {
    id: "cat-02",
    name: "Protección de cabeza",
    slug: "proteccion-de-cabeza",
    description: "Cascos industriales y de altura, barbuquejos y accesorios.",
    image: helmet,
    status: "activa",
    order: 2,
  },
  {
    id: "cat-03",
    name: "Protección ocular",
    slug: "proteccion-ocular",
    description: "Gafas, monogafas y caretas de protección visual.",
    image: respiratory,
    status: "activa",
    order: 3,
  },
  {
    id: "cat-04",
    name: "Protección auditiva",
    slug: "proteccion-auditiva",
    description: "Orejeras y tapones con atenuación certificada.",
    image: respiratory,
    status: "activa",
    order: 4,
  },
  {
    id: "cat-05",
    name: "Protección respiratoria",
    slug: "proteccion-respiratoria",
    description: "Respiradores de media cara, filtros y equipos autónomos.",
    image: respiratory,
    status: "activa",
    order: 5,
  },
  {
    id: "cat-06",
    name: "Protección de manos y cuerpo",
    slug: "proteccion-manos-cuerpo",
    description: "Guantes técnicos, ropa de protección y calzado de seguridad.",
    image: harness,
    status: "activa",
    order: 6,
  },
  {
    id: "cat-07",
    name: "Rescate y espacios confinados",
    slug: "rescate-espacios-confinados",
    description: "Trípodes, cuerdas, poleas y sistemas de rescate vertical.",
    image: rope,
    status: "activa",
    order: 7,
  },
  {
    id: "cat-08",
    name: "Emergencia e incendios",
    slug: "emergencia-incendios",
    description: "Equipos de emergencia, detección y protección contra incendios.",
    image: helmet,
    status: "activa",
    order: 8,
  },
];

export const mockCategories: Category[] = import.meta.env.DEV ? demoCategories : [];

const demoManufacturers: Manufacturer[] = [
  { id: "man-01", name: "Vertikal Safety", country: "España", website: "vertikal.example" },
  { id: "man-02", name: "IronGuard Industrial", country: "Alemania", website: "ironguard.example" },
  { id: "man-03", name: "AltoTec", country: "Francia", website: "altotec.example" },
  { id: "man-04", name: "SafeLine Systems", country: "Estados Unidos", website: "safeline.example" },
  { id: "man-05", name: "Respira Pro", country: "Italia", website: "respirapro.example" },
];

export const mockManufacturers: Manufacturer[] = import.meta.env.DEV ? demoManufacturers : [];

const demoRoles: Role[] = [
  {
    id: "rol-01",
    name: "administrador",
    label: "Administrador",
    description: "Control total del sistema, catálogo, usuarios y configuración.",
  },
  {
    id: "rol-02",
    name: "supervisor",
    label: "Supervisor",
    description: "Supervisa inventario, asignaciones e inspecciones de su planta.",
  },
  {
    id: "rol-03",
    name: "inspector",
    label: "Inspector",
    description: "Registra inspecciones y determina el resultado del equipo.",
  },
  {
    id: "rol-04",
    name: "tecnico",
    label: "Técnico",
    description: "Ejecuta mantenimientos y actualiza el estado físico del equipo.",
  },
  {
    id: "rol-05",
    name: "usuario",
    label: "Usuario",
    description: "Consulta equipos asignados y su documentación.",
  },
];

export const mockRoles: Role[] = import.meta.env.DEV ? demoRoles : [];

export const getCategoryName = (id: string) =>
  mockCategories.find((c) => c.id === id)?.name ?? "Sin categoría";

export const getManufacturerName = (id: string) =>
  mockManufacturers.find((m) => m.id === id)?.name ?? "Sin fabricante";
