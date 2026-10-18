
import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
export const Route=createFileRoute("/admin/reportes")({component:()=> <div className="space-y-4"><h1 className="font-display text-2xl font-extrabold">Reportes</h1><p className="text-sm text-muted-foreground">Gestión administrativa de reportes preparada para conexión futura con backend.</p><Link to="/reportes" className="text-sm font-semibold text-primary">Abrir reportes</Link></div>});
