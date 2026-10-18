
import { createFileRoute } from "@tanstack/react-router";
export const Route=createFileRoute("/admin/configuracion")({component:()=> <div className="space-y-4"><p className="label-caps">Administración</p><h1 className="font-display text-2xl font-extrabold">Configuración</h1><div className="panel p-5 text-sm text-muted-foreground">Esta primera versión deja esta sección preparada para preferencias, reglas de inspección, parámetros del sistema e integraciones futuras.</div></div>});
