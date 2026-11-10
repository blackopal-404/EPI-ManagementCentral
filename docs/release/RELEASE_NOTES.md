# EPI Management Central — ajustes para lanzamiento

- El documento de cotización ahora se muestra en la columna central de contenido, entre el menú lateral y el panel derecho de datos, en escritorio.
- En pantallas pequeñas, el contenido se apila para conservar la legibilidad.
- El panel de datos de cotización permanece disponible a la derecha en escritorio y se mantiene fuera de la impresión.
- La tarjeta de empresa aplica padding interior consistente para separar contacto, teléfono, dirección y equipos de los bordes.
- El recurso del logo de EPI tiene transparencia fuera del marco naranja. El logo corporativo de Vertical Safety HN se conserva para inicio de sesión y documentos de cotización.
- Se retiraron de la interfaz el QR de ejemplo, la simulación de escaneo y el acceso local de demostración.
- Se actualizaron textos de marca antiguos a EPI Management Central.
- Se añadió una consulta de auditoría de solo lectura para identificar datos temporales en PostgreSQL.

## Antes de publicar

1. Ejecutar `npm ci` y `npm run build` en un entorno limpio.
2. Ejecutar `database/migrations/007_app_brand_name.sql` en Neon para actualizar el nombre de la aplicación sin sobrescribir un valor personalizado.
3. Ejecutar `docs/release/RELEASE_CLEANUP_AUDIT.sql` para revisar los posibles registros temporales. No borrar el registro de empresa `So cool tech` ni su asignación de equipo sin confirmación expresa.
4. Revisar el resultado de las consultas y eliminar solo registros confirmados como pruebas, después de una copia de seguridad.
5. Desplegar y verificar cotizaciones en escritorio, móvil, impresión/PDF, empresas y escáner.
