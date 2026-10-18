import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ShieldCheck, AlertCircle } from "lucide-react";
import { handleGoogleCredential, renderGoogleButton, saveSession } from "@/lib/auth";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const navigate = useNavigate();
  const googleRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    if (googleRef.current) renderGoogleButton(googleRef.current, async (credential) => { try { await handleGoogleCredential(credential); if (active) navigate({ to: "/" }); } catch (e) { if (active) setError(e instanceof Error ? e.message : "No se pudo iniciar sesión."); } }).catch((e) => active && setError(e instanceof Error ? e.message : "No se pudo cargar Google."));
    return () => { active = false; };
  }, [navigate]);
  function localDemo() { saveSession({ name: "Usuario Magna (demo)", email: "magna@local.test", role: "magna" }); navigate({ to: "/" }); }
  return <main className="grid min-h-screen place-items-center bg-background px-4 py-8"><section className="w-full max-w-md panel p-6 sm:p-8"><div className="flex items-center gap-3"><div className="w-44"><img src="/vertical-safety-logo.png" alt="Vertical Safety" className="w-full" /></div><div><p className="label-caps">EPIControl</p><h1 className="font-display text-xl font-extrabold">Acceso seguro</h1></div></div><p className="mt-6 text-sm text-muted-foreground">Inicia sesión con tu cuenta de Google para administrar el sistema de equipos de protección.</p><div ref={googleRef} className="mt-6 flex min-h-10 justify-center"/>{error && <div className="mt-4 flex gap-2 rounded-md border border-danger/20 bg-danger-soft p-3 text-xs text-danger"><AlertCircle className="h-4 w-4 shrink-0"/><span>{error}</span></div>}<div className="my-6 flex items-center gap-3"><div className="h-px flex-1 bg-border"/><span className="text-xs text-muted-foreground">desarrollo local</span><div className="h-px flex-1 bg-border"/></div><button type="button" onClick={localDemo} className="flex w-full items-center justify-center gap-2 rounded-md border border-border px-4 py-2.5 text-sm font-bold hover:bg-muted"><ShieldCheck className="h-4 w-4"/> Entrar como Magna (solo local)</button><p className="mt-4 text-center text-[11px] text-muted-foreground">El acceso Magna real se controla por correo autorizado en el backend. El botón de desarrollo no aparece en producción.</p></section></main>;
}
