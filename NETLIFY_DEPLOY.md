# Despliegue de EPIControl en Netlify

## Estado
Este proyecto está configurado para el adaptador oficial de TanStack Start para Netlify. Esto permite desplegar la app SSR y rutas/funciones de servidor en Netlify Functions.

**Advertencia:** EPIControl todavía no tiene un backend de negocio conectado a una base de datos real. Esta configuración prepara el despliegue de la aplicación, no la convierte en un sistema de producción para ventas/inventario. No registrar datos reales hasta implementar y verificar backend, base de datos y autorización server-side.

## Antes de subir a GitHub
1. Descomprime este proyecto en una carpeta de trabajo.
2. Instala Node.js 22.16.0 o superior compatible (la versión de `.nvmrc` es 22.16.0).
3. En la raíz ejecuta `npm install`. Esto debe generar `package-lock.json`; incluye ese archivo en el commit.
4. Ejecuta `npm run build`. No subas si el build falla.
5. Verifica que `.env.local` no se suba. Los archivos `*.local` y `node_modules` están ignorados por Git.

## GitHub y el repositorio compartido
`git@github.com:netlify/create-react-app-lambda.git` es un repositorio público de ejemplo de Netlify basado en Create React App y netlify-lambda. **No es el repositorio de EPIControl y no es la base que debemos sobrescribir.** Usa el repositorio propio de EPIControl que ya esté enlazado a Netlify, o crea uno nuevo llamado `epicontrol` bajo tu cuenta/organización.

## Ajustes de Netlify
En Site configuration / Build & deploy configura:
- Build command: `npm run build`
- Publish directory: `dist/client`
- Base directory: raíz del repositorio (vacía si `package.json` está en la raíz).

`netlify.toml` ya define estos valores. Netlify desplegará de nuevo cada vez que se haga push a la rama conectada.

## Variables de entorno
Añade solo las variables necesarias para el estado actual de la aplicación en Netlify > Site configuration > Environment variables. Para el botón Google OAuth, configura `VITE_GOOGLE_CLIENT_ID` con el Client ID real y `VITE_MAGNA_EMAILS` con los correos permitidos, si el código actual los necesita. Los valores `VITE_*` se exponen al navegador; nunca pongas secretos ni contraseñas en ellos.

Los valores de `.env.production.example` son solo nombres/plantillas. `DATABASE_URL`, `GOOGLE_CLIENT_ID` y `MAGNA_EMAILS` todavía no están conectados a un backend real en esta versión. No agregues una contraseña de base de datos hasta que exista código server-side que la use.

## Base de datos y datos reales
El build sin datos demo no sustituye un backend. La autenticación y permisos actuales no deben considerarse seguridad de producción: roles y accesos deben verificarse en servidor. Antes de usar ventas/inventario reales, implementa DB, migraciones, endpoints, transacciones y autorización.
