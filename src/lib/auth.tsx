import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type AppUser = { name: string; email: string; picture?: string; role: "magna" | "usuario" };
const AUTH_KEY = "sgh:auth";
const MAGNA_EMAILS = (import.meta.env.VITE_MAGNA_EMAILS ?? "").split(",").map((x: string) => x.trim().toLowerCase()).filter(Boolean);

function readSession(): AppUser | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = JSON.parse(localStorage.getItem(AUTH_KEY) ?? "null") as AppUser | null;
    if (!stored?.email) return null;
    // Recalcula el rol usando la lista autorizada actual. Evita que una sesión antigua
    // conserve el rol "usuario" después de autorizar el correo como Magna (o viceversa).
    return { ...stored, role: isMagnaEmail(stored.email) ? "magna" : "usuario" };
  } catch { return null; }
}
export function isMagnaEmail(email: string) { return MAGNA_EMAILS.includes(email.toLowerCase()) || (import.meta.env.DEV && email.toLowerCase() === "magna@local.test"); }
export function saveSession(user: AppUser) { localStorage.setItem(AUTH_KEY, JSON.stringify(user)); window.dispatchEvent(new Event("sgh-auth")); }
export function clearSession() { localStorage.removeItem(AUTH_KEY); window.dispatchEvent(new Event("sgh-auth")); }

function decodeCredential(credential: string): { name?: string; email?: string; picture?: string } {
  try { const payload = credential.split(".")[1]; return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))); } catch { return {}; }
}

export async function handleGoogleCredential(credential: string) {
  const data = decodeCredential(credential);
  if (!data.email) throw new Error("Google no devolvió un correo válido.");
  const user: AppUser = { name: data.name ?? data.email.split("@")[0], email: data.email, picture: data.picture, role: isMagnaEmail(data.email) ? "magna" : "usuario" };
  saveSession(user);
  return user;
}

interface GoogleApi { accounts: { id: { initialize(args: { client_id: string; callback: (response: { credential: string }) => void }): void; renderButton(el: HTMLElement, options: Record<string, unknown>): void } } }
declare global { interface Window { google?: GoogleApi } }

export async function loadGoogleIdentityScript() {
  if (typeof window === "undefined") return;
  if (window.google?.accounts?.id) return;
  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) { existing.addEventListener("load", () => resolve(), { once: true }); existing.addEventListener("error", () => reject(new Error("No se pudo cargar Google Identity Services.")), { once: true }); return; }
    const script = document.createElement("script"); script.src = "https://accounts.google.com/gsi/client"; script.async = true; script.defer = true;
    script.onload = () => resolve(); script.onerror = () => reject(new Error("No se pudo cargar Google Identity Services.")); document.head.appendChild(script);
  });
}

export async function renderGoogleButton(container: HTMLElement, onCredential: (credential: string) => void) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error("Falta VITE_GOOGLE_CLIENT_ID en .env.local. Crea un Client ID OAuth de tipo Web en Google Cloud.");
  await loadGoogleIdentityScript();
  if (!window.google) throw new Error("Google Identity Services no está disponible.");
  window.google.accounts.id.initialize({ client_id: clientId, callback: ({ credential }) => onCredential(credential) });
  container.innerHTML = "";
  window.google.accounts.id.renderButton(container, { theme: "outline", size: "large", width: 360, text: "signin_with", shape: "rectangular" });
}

const AuthContext = createContext<{ user: AppUser | null; ready: boolean; logout: () => void }>({ user: null, ready: false, logout: clearSession });
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(() => readSession());
  const [ready, setReady] = useState(false);
  useEffect(() => { const sync = () => setUser(readSession()); sync(); setReady(true); window.addEventListener("sgh-auth", sync); return () => window.removeEventListener("sgh-auth", sync); }, []);
  const value = useMemo(() => ({ user, ready, logout: clearSession }), [user, ready]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() { return useContext(AuthContext); }
