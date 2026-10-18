# Preparación de producción — EPIControl

## Estado real de esta entrega

Esta entrega prepara el frontend para no exponer datos de demostración cuando se genera un build de producción. **No significa que la aplicación ya esté conectada a una base de datos ni lista para registrar operaciones reales.**

### Cambios incluidos

- Los arrays `mock*` se exportan vacíos cuando `import.meta.env.DEV` es falso.
- El adaptador local (`localStorage`) se utiliza solo durante desarrollo.
- En producción, los intentos de guardar mediante el adaptador local generan un error explícito en vez de fingir que el dato quedó persistido.
- El escaneo simulado queda limitado al modo desarrollo.
- No se borraron archivos, registros reales, claves del navegador ni datos del usuario.

### Qué seguirá pendiente antes de producción

1. Confirmar el proveedor/plan de hosting Node.js y qué motores de base de datos ofrece en la misma región.
2. Elegir MySQL/MariaDB o PostgreSQL según lo que el proveedor soporte y administre.
3. Crear migraciones versionadas y ejecutar el esquema en una base nueva vacía.
4. Implementar endpoints del backend y sustituir los métodos mock de `src/services/index.ts` por llamadas a esos endpoints.
5. Implementar autenticación verificada por el servidor; `localStorage`, variables `VITE_*` y roles calculados en cliente no son controles de seguridad.
6. Implementar autorización de Magna en cada endpoint administrativo.
7. Implementar transacciones de ventas y movimientos para que dos ventas simultáneas no puedan descontar las mismas existencias.
8. Configurar almacenamiento seguro de documentos, copias de seguridad, registros de auditoría y recuperación.
9. Añadir pruebas automatizadas para stock, ventas, Data Matrix, permisos y reportes.

## Entidades que debe cubrir el esquema

- `users` y `sessions` (roles y estado de usuario)
- `categories`, `manufacturers`, `products`
- `warehouse_products` y `inventory_movements`
- `equipment` (unidad individual, número de serie y `data_matrix_code` único cuando se proporcione)
- `equipment_assignments`, `inspections`, `maintenance_records`, `equipment_history`
- `sales`, `sale_lines`, `sale_payments`
- `quotes` y `quote_lines`
- `technical_documents`
- `purchase_plans` y `purchase_plan_lines`
- `audit_log` y `app_settings`

### Reglas del modelo

- SKU, código interno y códigos Data Matrix deben tener restricciones de unicidad en el ámbito correspondiente.
- Una venta confirmada y sus movimientos de inventario deben guardarse dentro de una transacción.
- Una orden de compra pendiente no incrementa el stock físico.
- Las cotizaciones no se contabilizan como ventas.
- Los movimientos registrados no deben borrarse para corregir errores: deben registrarse movimientos de reversión/ajuste con motivo y usuario responsable.
- Los valores monetarios deben almacenarse en `DECIMAL`/`NUMERIC`, no en coma flotante.
- Las fechas de compra, recepción, inspección y cambio de estado deben conservar trazabilidad.
- No insertar productos, usuarios, ventas, equipos ni inspecciones ficticias en producción. El seed inicial debe estar vacío, salvo catálogos de referencia aprobados explícitamente.

## Variables de entorno

Los nombres propuestos se documentan como preparación, todavía no son consumidos por un backend de base de datos en esta versión:

- `DATABASE_URL`: conexión privada a la base de datos.
- `GOOGLE_CLIENT_ID`: cliente OAuth que el servidor verificará.
- `MAGNA_EMAILS`: lista de correos autorizados para rol Magna, leída y validada en servidor.
- `APP_ENV=production`.

Nunca poner contraseñas de base de datos en variables `VITE_*`, ya que se exponen al navegador. No añadir secretos al ZIP ni al repositorio.

## Elección de motor

No se fija todavía un motor porque no se ha confirmado el proveedor/plan exacto. Antes de crear la migración definitiva, comprobar en la consola del hosting:

- soporte para Node.js 20.19+ o 22.12+;
- proceso Node persistente y comando de arranque;
- versiones de MySQL/MariaDB o PostgreSQL disponibles;
- acceso de red privado desde Node hacia la base;
- backups automáticos, restauración y límites de conexiones;
- variables de entorno seguras y TLS.

Después de confirmar proveedor y motor, crear una migración específica para ese motor. No ejecutar un esquema de otro motor por aproximación.
