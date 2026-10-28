import { createFileRoute } from "@tanstack/react-router";
import { InspectionPrintReport } from "@/components/inspections/InspectionPrintReport";

export const Route = createFileRoute("/admin/reporte-inspecciones")({ component: InspectionPrintReport });
