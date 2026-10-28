# Implementación de usuarios, permisos, empresas y acceso

## Incluye
- Alta de usuarios con nombre completo, nombre de usuario, correo, celular, número de identidad, rol y contraseña inicial.
- Contraseñas con hash `scrypt` y sesiones de servidor mediante cookie `HttpOnly`.
- Inicio de sesión con Google o usuario/contraseña. Las cuentas existentes se vinculan por correo verificado de Google y conservan su rol asignado, salvo la cuenta Magna autorizada por `MAGNA_EMAILS`.
- Creación de categorías/roles con permisos por módulo; los permisos se envían al navegador desde el servidor y las rutas de API protegidas los vuelven a comprobar.
- Alta de empresas por RTN, nombre, contacto, teléfono, correo y dirección.
- Asignación de unidades de equipo a empresas con historial de asignación activa.
- Configuración general: nombre de aplicación/empresa, zona horaria, formato de fecha, duración de sesión y preferencias operativas.

## Antes de desplegar
1. Haz una copia del proyecto y de la base de datos.
2. En Neon SQL Editor, ejecuta el contenido completo de `database/migrations/005_users_companies_settings.sql` sobre la base de datos existente. La migración es aditiva y no elimina registros.
3. Verifica que `MAGNA_EMAILS` en Netlify contenga el correo exacto de la cuenta Magna, separado por comas si hay más de uno. No pongas contraseñas ni tokens en el código.
4. En la raíz del proyecto, ejecuta `npm ci` y luego `npm run build`.
5. Si la compilación termina sin errores, haz commit y push para desplegar en Netlify.
6. Inicia sesión como Magna mediante Google, crea una categoría con permisos limitados, crea un usuario de prueba y comprueba que el menú y los endpoints respetan esos permisos.

## Notas importantes
- El acceso a módulos se configura por categoría. Las operaciones críticas de creación de usuarios y roles siguen reservadas a la administración; la cuenta Magna autorizada es la única que puede asignar el rol `magna` o `administrador` desde el formulario.
- La contraseña inicial debe tener al menos 10 caracteres. No se guarda en texto plano.
- No se pudo ejecutar una compilación completa en el entorno de preparación porque la instalación de dependencias agotó el tiempo disponible. Ejecuta `npm run build` localmente antes de desplegar.
- La duración de sesión se aplica al crear nuevas sesiones; cambiarla no acorta automáticamente las sesiones ya emitidas.

## Validación en este paquete
- `tsc --noEmit`: pasó después de actualizar el árbol de rutas y corregir los `queryFn` del reporte de inspecciones.
- No se pudo ejecutar el bundle Vite en el entorno de preparación porque el ZIP de dependencias original no contenía el binding nativo de Rolldown para Linux. La compilación final debe ejecutarse con una instalación limpia de dependencias en el equipo de desarrollo o en Netlify.
