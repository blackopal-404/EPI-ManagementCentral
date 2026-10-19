
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { userService } from "@/services";
import { SectionCard } from "@/components/common/SectionCard";

export const Route=createFileRoute("/admin/usuarios")({component:AdminUsers});
function AdminUsers(){const{data}=useQuery({queryKey:["admin-users"],queryFn:userService.getUsers});return <div className="space-y-5"><header><p className="label-caps">Administración</p><h1 className="mt-1 font-display text-2xl font-extrabold">Usuarios y roles</h1><p className="mt-1 text-sm text-muted-foreground">Usuarios registrados mediante la autenticación del sistema y sus roles asignados.</p></header><SectionCard title="Usuarios"><div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead className="bg-muted/50 text-xs uppercase text-muted-foreground"><tr>{["Usuario","Correo","Rol","Estado","Ubicación"].map(x=><th key={x} className="px-4 py-3">{x}</th>)}</tr></thead><tbody className="divide-y divide-border">{(data??[]).map(u=><tr key={u.id}><td className="px-4 py-3 font-semibold">{u.fullName}</td><td className="px-4 py-3">{u.email}</td><td className="px-4 py-3">{u.role}</td><td className="px-4 py-3">{u.status}</td><td className="px-4 py-3">{u.location}</td></tr>)}</tbody></table></div></SectionCard></div>}
