# EPI-Central — backend inicial

Esta versión añade una primera capa de backend para Netlify Functions y PostgreSQL. **No es todavía la migración completa de todos los módulos del sistema.**

## Instalación

1. Copia los archivos del ZIP sobre una copia de trabajo del proyecto actual (conserva tu copia original).
2. Ejecuta `npm install` para instalar `pg`, `@netlify/functions` y sus tipos.
3. Ejecuta `npm run build`. No despliegues si falla.
4. En Netlify > Project configuration > Environment variables configura:
   - `DATABASE_URL`: connection string pooled de Neon, con TLS.
   - `GOOGLE_CLIENT_ID`: el mismo Client ID OAuth Web que usa el frontend.
   - `MAGNA_EMAILS`: lista separada por comas de correos autorizados para el rol Magna.
   - `VITE_GOOGLE_CLIENT_ID`: solo el Client ID público para inicializar el botón Google.
5. Vuelve a desplegar.
6. Prueba `/.netlify/functions/api/health`. Debe devolver `{"ok":true,"database":"connected"}`.

Nunca compartas ni subas la cadena `DATABASE_URL`. No la uses con prefijo `VITE_`.

## Endpoints implementados

- `GET /.netlify/functions/api/health`
- `POST /.netlify/functions/api/auth/google`
- `GET /.netlify/functions/api/auth/session`
- `POST /.netlify/functions/api/auth/logout`
- `GET /.netlify/functions/api/categories`
- `GET /.netlify/functions/api/products`
- `GET /.netlify/functions/api/equipment`
- `POST /.netlify/functions/api/equipment`
- `PUT /.netlify/functions/api/equipment/:id`
- `DELETE /.netlify/functions/api/equipment/:id` (retira el equipo cambiando estado a `retirado`; no lo borra físicamente)
- `GET /.netlify/functions/api/admin/bootstrap`

Todos los endpoints de negocio requieren sesión. Las mutaciones de equipos requieren rol `magna` o `administrador` verificado en la base. Google ID tokens se verifican en servidor contra Google y la audiencia configurada. El servidor emite una cookie `HttpOnly`, `Secure`, `SameSite=Lax`; la base guarda únicamente el hash de la sesión.

## Estado de integración

El login del frontend ya intercambia la credencial con el backend y vuelve a verificar la sesión en el servidor al cargar. Sin embargo, los servicios de productos/equipos/inspecciones/bodega/ventas y otros módulos de `src/services/index.ts` aún no han sido migrados completamente desde mock/local adapters a estos endpoints. La UI no debe considerarse conectada de extremo a extremo, y no deben registrarse operaciones reales hasta terminar esa migración y las pruebas.

La migración SQL `database/migrations/001_initial_schema.sql` se incluye como referencia versionada. Como ya ejecutaste el esquema en Neon, **no vuelvas a ejecutar el archivo completo sobre la base existente sin revisar la migración primero**.
