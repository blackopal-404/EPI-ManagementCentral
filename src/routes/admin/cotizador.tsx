import { createFileRoute } from "@tanstack/react-router";
import { QuotesPage } from "../cotizaciones";

export const Route = createFileRoute("/admin/cotizador")({ component: QuotesPage });
