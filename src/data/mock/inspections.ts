import type { Inspection, EquipmentHistory, EquipmentMaintenance, EquipmentAssignment } from "@/types";

const demoInspections: Inspection[] = [
  {
    id: "ins-01",
    equipmentId: "eqp-001",
    inspectorId: "usr-03",
    date: "2026-08-15",
    result: "aprobado",
    observations: "Cintas, costuras y hebillas en buen estado. Sin indicios de caída.",
    recommendations: "Continuar con inspección semestral.",
    nextInspectionDate: "2026-09-16",
    photos: ["mock://inspecciones/ins-01-1.jpg", "mock://inspecciones/ins-01-2.jpg"],
  },
  {
    id: "ins-02",
    equipmentId: "eqp-003",
    inspectorId: "usr-04",
    date: "2026-03-12",
    result: "aprobado_con_observaciones",
    observations: "Ligero desgaste en cinta subpélvica, dentro de tolerancia.",
    recommendations: "Vigilar el desgaste en la próxima revisión.",
    nextInspectionDate: "2026-09-14",
    photos: ["mock://inspecciones/ins-02-1.jpg"],
  },
  {
    id: "ins-03",
    equipmentId: "eqp-007",
    inspectorId: "usr-03",
    date: "2026-04-18",
    result: "rechazado",
    observations: "Abrasión severa en funda y deformación del dispositivo deslizante.",
    recommendations: "Retirar del servicio y tramitar baja técnica.",
    nextInspectionDate: "2026-10-18",
    photos: ["mock://inspecciones/ins-03-1.jpg"],
  },
  {
    id: "ins-04",
    equipmentId: "eqp-011",
    inspectorId: "usr-04",
    date: "2025-08-11",
    result: "aprobado",
    observations: "Equipo conforme en el momento de la revisión.",
    nextInspectionDate: "2026-08-11",
    photos: [],
  },
  {
    id: "ins-05",
    equipmentId: "eqp-014",
    inspectorId: "usr-03",
    date: "2026-08-25",
    result: "aprobado_con_observaciones",
    observations: "Carcasa con marcas superficiales de impacto. Frenado correcto.",
    recommendations: "Limpieza y verificación de retracción cada 3 meses.",
    nextInspectionDate: "2027-02-25",
    photos: ["mock://inspecciones/ins-05-1.jpg"],
  },
  {
    id: "ins-06",
    equipmentId: "eqp-016",
    inspectorId: "usr-04",
    date: "2025-07-20",
    result: "aprobado",
    observations: "Casco sin fisuras, arnés interior íntegro.",
    nextInspectionDate: "2026-07-20",
    photos: [],
  },
  {
    id: "ins-07",
    equipmentId: "eqp-020",
    inspectorId: "usr-03",
    date: "2026-03-19",
    result: "aprobado",
    observations: "Ajuste micrométrico correcto, barbuquejo íntegro.",
    nextInspectionDate: "2026-09-19",
    photos: [],
  },
  {
    id: "ins-08",
    equipmentId: "eqp-028",
    inspectorId: "usr-04",
    date: "2026-06-13",
    result: "aprobado_con_observaciones",
    observations: "Válvula de exhalación con residuos. Limpieza realizada en sitio.",
    recommendations: "Sustituir filtros antes de la próxima campaña.",
    nextInspectionDate: "2026-09-13",
    photos: ["mock://inspecciones/ins-08-1.jpg"],
  },
  {
    id: "ins-09",
    equipmentId: "eqp-034",
    inspectorId: "usr-03",
    date: "2026-02-11",
    result: "rechazado",
    observations: "Suela desprendida y puntera deformada.",
    recommendations: "Reposición inmediata.",
    nextInspectionDate: "2026-08-11",
    photos: [],
  },
  {
    id: "ins-10",
    equipmentId: "eqp-037",
    inspectorId: "usr-04",
    date: "2026-09-02",
    result: "pendiente",
    observations: "Inspección en curso: pendiente de prueba de carga del trípode.",
    nextInspectionDate: "2027-09-02",
    photos: [],
  },
];

export const mockInspections: Inspection[] = import.meta.env.DEV ? demoInspections : [];

const demoHistory: EquipmentHistory[] = [
  { id: "his-01", equipmentId: "eqp-001", date: "2026-08-15", type: "inspeccion", title: "Inspección realizada", detail: "Resultado: aprobado. Inspector: Carlos Medina.", actor: "Carlos Medina" },
  { id: "his-02", equipmentId: "eqp-001", date: "2026-08-02", type: "asignacion", title: "Asignado a Juan Pérez", detail: "Asignación para trabajos en torre de enfriamiento.", actor: "María Solís" },
  { id: "his-03", equipmentId: "eqp-001", date: "2026-07-10", type: "ubicacion", title: "Cambio de ubicación", detail: "De Centro de Distribución a Planta Norte — Almacén EPP.", actor: "Ana Castillo" },
  { id: "his-04", equipmentId: "eqp-001", date: "2026-06-05", type: "mantenimiento", title: "Mantenimiento realizado", detail: "Limpieza técnica y verificación de hebillas.", actor: "Diego Ortega" },
  { id: "his-05", equipmentId: "eqp-001", date: "2025-01-10", type: "alta", title: "Alta en el sistema", detail: "Equipo registrado e identificado mediante código.", actor: "María Solís" },
  { id: "his-06", equipmentId: "eqp-007", date: "2026-04-18", type: "estado", title: "Fuera de servicio", detail: "Bloqueado tras inspección rechazada.", actor: "Carlos Medina" },
  { id: "his-07", equipmentId: "eqp-007", date: "2026-04-18", type: "inspeccion", title: "Inspección rechazada", detail: "Abrasión severa en funda.", actor: "Carlos Medina" },
  { id: "his-08", equipmentId: "eqp-011", date: "2026-08-11", type: "estado", title: "Inspección vencida", detail: "El sistema marcó el equipo como vencido.", actor: "Sistema" },
  { id: "his-09", equipmentId: "eqp-011", date: "2025-08-11", type: "inspeccion", title: "Inspección realizada", detail: "Resultado: aprobado.", actor: "Lucía Ramírez" },
  { id: "his-10", equipmentId: "eqp-014", date: "2026-08-25", type: "mantenimiento", title: "Mantenimiento preventivo", detail: "Verificación de retracción y limpieza de carcasa.", actor: "Héctor Nava" },
];

export const mockHistory: EquipmentHistory[] = import.meta.env.DEV ? demoHistory : [];

const demoMaintenance: EquipmentMaintenance[] = [
  { id: "mnt-01", equipmentId: "eqp-014", date: "2026-08-25", type: "preventivo", description: "Verificación de retracción y limpieza.", responsibleId: "usr-09" },
  { id: "mnt-02", equipmentId: "eqp-025", date: "2026-08-28", type: "correctivo", description: "Sustitución de almohadillas.", responsibleId: "usr-05" },
  { id: "mnt-03", equipmentId: "eqp-001", date: "2026-06-05", type: "limpieza", description: "Limpieza técnica de cintas.", responsibleId: "usr-05" },
];

export const mockMaintenance: EquipmentMaintenance[] = import.meta.env.DEV ? demoMaintenance : [];

const demoAssignments: EquipmentAssignment[] = [
  { id: "asg-01", equipmentId: "eqp-001", userId: "usr-01", assignedAt: "2026-08-02", location: "Planta Norte — Almacén EPP" },
  { id: "asg-02", equipmentId: "eqp-005", userId: "usr-05", assignedAt: "2026-05-21", location: "Taller de mantenimiento" },
  { id: "asg-03", equipmentId: "eqp-011", userId: "usr-08", assignedAt: "2025-09-04", returnedAt: "2026-08-30", location: "Planta Sur — Taller mecánico" },
];

export const mockAssignments: EquipmentAssignment[] = import.meta.env.DEV ? demoAssignments : [];
