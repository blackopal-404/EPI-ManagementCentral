import { createFileRoute } from "@tanstack/react-router";
import { InspectionPrintReport } from "@/components/inspections/InspectionPrintReport";

export const Route = createFileRoute("/reporte-inspecciones")({ component: InspectionPrintReport });
