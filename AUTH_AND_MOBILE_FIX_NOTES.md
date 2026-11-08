# Corrección de diagnóstico de autenticación y menú móvil

## Cambios
- El inicio de sesión Google ahora registra en los logs de Netlify la etapa en la que falla (`verify-google-token`, `lookup-user-and-role`, `create-google-user`, `create-session`, etc.) y un resumen técnico del error. No registra el token de Google, cookies ni contraseñas.
- La lectura de sesión registra nombre/mensaje/código de error para facilitar el diagnóstico.
- Los menús móviles de la aplicación general y administración se renderizan mediante `createPortal` directamente en `document.body`, con capas explícitas. Esto evita que el drawer quede detrás de un overlay o atrapado en un contexto de apilamiento del layout.

## Usuario temporal
Archivo: `docs/TEMPORARY_TEST_USER.sql`

- Username: `epi_test`
- Password: `h9tNgUcn07QW9nX07YZJZAUj`
- Correo interno: `epi.test@invalid.local`
- Rol: `administrador`
- No es Magna y no cambia `MAGNA_EMAILS`.
- Requiere que la migración `005_users_companies_settings.sql` esté aplicada.
- El SQL aborta si ya existe un usuario con ese username/correo.
- Al terminar, ejecutar el DELETE comentado al final del SQL para retirar la cuenta.

## Pasos de validación
1. Ejecutar `npm ci`.
2. Ejecutar `npm run build`.
3. Aplicar el SQL temporal en Neon únicamente si la migración 005 ya está aplicada.
4. Publicar el ZIP en un deploy de prueba o branch de producción controlado.
5. Revisar Netlify Function logs: buscar `[auth/google] failed at stage=...`.
6. Probar el menú móvil en `/equipos` y `/admin`.

No se ha cambiado el esquema de Neon ni se ha insertado ningún usuario en la base de datos desde este ZIP.
