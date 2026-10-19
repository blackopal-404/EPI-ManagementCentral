# Backend EPI-Central — primera fase

Esta entrega añade una API serverless inicial para Netlify Functions y PostgreSQL. No declara terminada la migración de todos los módulos de negocio.

## Endpoints

- `GET /.netlify/functions/api/health`: comprueba conexión a PostgreSQL; no devuelve detalles sensibles.
- `POST /.netlify/functions/api/auth/google`: valida la credencial ID de Google en el servidor, crea/actualiza el usuario y crea una sesión opaca almacenando solo el hash del token en `sessions`.
- `GET /.netlify/functions/api/auth/session`: consulta la sesión vigente.
- `POST /.netlify/functions/api/auth/logout`: revoca la sesión y limpia la cookie.
- `GET /.netlify/functions/api/categories`: categorías activas (requiere sesión).
- `GET /.netlify/functions/api/products`: productos e imágenes (requiere sesión).
- `GET /.netlify/functions/api/equipment`: equipos (requiere sesión).
- `POST /.netlify/functions/api/equipment`: alta de equipo, restringida a `magna` o `administrador`.
- `GET /.netlify/functions/api/admin/bootstrap`: comprobación básica de sesión y rol.

## Seguridad implementada en esta fase

- `DATABASE_URL` se lee únicamente en Node/Netlify Functions.
- Consultas SQL parametrizadas.
- Validación de ID token de Google en el servidor con audiencia y `email_verified`.
- Rol `magna` derivado de la lista server-only `MAGNA_EMAILS`; el cliente no puede elegir su rol.
- Cookie de sesión `HttpOnly; Secure; SameSite=Lax`, token aleatorio y hash SHA-256 guardado en la tabla `sessions`.
- Rechazo de peticiones de escritura de origen cruzado.
- Comprobación de permisos en el servidor y registro de auditoría de altas de equipo e inicio/cierre de sesión.
- Respuestas genéricas ante errores internos; los detalles quedan en logs de función.

## Configuración de Neon + Netlify

En Netlify > Project configuration > Environment variables, define `DATABASE_URL`, `GOOGLE_CLIENT_ID` y `MAGNA_EMAILS` para el contexto de producción (y Deploy Previews si se necesitan). Mantén `DATABASE_URL` y `GOOGLE_CLIENT_ID` server-only, sin prefijo `VITE_`. `VITE_GOOGLE_CLIENT_ID` es el Client ID público para inicializar Google Identity Services en el navegador.

Usa la cadena de conexión pooled de Neon con TLS. No pegues secretos en el repositorio ni en el chat. El endpoint health puede comprobar la conectividad después de desplegar.

## Importante: todavía no es una migración integral de negocio

Los servicios de frontend (`src/services/index.ts`) aún contienen adaptadores mock/locales para varias áreas. Esta fase no migra automáticamente ventas, pagos, cotizaciones, planificación de compras, mantenimiento, inspecciones, imágenes ni todos los CRUD a la API. No registrar operaciones reales hasta completar esa migración y las pruebas transaccionales. El endpoint de alta de equipo es la primera escritura protegida, no el backend completo de inventario.

## Pruebas sugeridas

1. Instalar dependencias y ejecutar `npm run build`.
2. Desplegar con variables server-only configuradas.
3. Probar `GET /.netlify/functions/api/health` (debe responder `database: connected`).
4. Probar login Google desde la UI una vez actualizado el cliente de autenticación.
5. Confirmar que `GET /auth/session` devuelve 401 sin cookie y el usuario después de iniciar sesión.
6. Confirmar que POST de equipo devuelve 403 a roles no autorizados.
7. Confirmar persistencia consultando el registro en Neon y desde otra sesión autorizada.
