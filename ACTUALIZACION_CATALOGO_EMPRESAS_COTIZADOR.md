# Actualización: catálogo comercial, cotizaciones y perfiles de empresas

## Qué cambió

- El cotizador consulta el catálogo de productos activos sin filtrar por existencias.
- Se puede cotizar cualquier cantidad, aunque la existencia física sea cero. El formulario muestra una advertencia de producto sin existencias / bajo pedido.
- Se agregó búsqueda por nombre y SKU y un campo de notas y condiciones comerciales.
- La cotización no reserva ni descuenta inventario. La salida de existencias continúa perteneciendo al flujo de venta.
- El módulo de Bodega ahora se presenta como catálogo comercial e inventario: mantiene una sola fuente de datos (`warehouse_products`) y muestra el último precio de venta almacenado junto con su moneda y las existencias físicas.
- El directorio de empresas incluye una vista de perfil por empresa con datos fiscales y de contacto, además de una tabla con los equipos asignados actualmente.
- Se corrigió la escritura de las líneas de cotización para usar `sku_snapshot` y `name_snapshot`, y los campos reales de encabezado de `quotes`.
- El escritor dinámico de PostgreSQL ahora omite columnas generadas automáticamente, como `line_total` generado en `quote_lines`.

## Modelo de datos

Se reutilizan las tablas existentes:

- `products`: catálogo maestro.
- `warehouse_products`: SKU, precio de venta vigente, costo, moneda y existencias.
- `quotes` y `quote_lines`: encabezado y detalle de cotizaciones con datos de producto/precio guardados como fotografía histórica.
- `companies` y `equipment_company_assignments`: empresas y asignaciones de equipos.
- `equipment`: unidades físicas identificables por código interno y número de serie.

No se agregó una tabla duplicada de catálogo ni se creó una migración nueva.

## Consideraciones

- El precio mostrado como último precio es el valor vigente de `warehouse_products.sale_price`; no se incorpora un historial de precios por fecha en esta actualización.
- La cantidad en `warehouse_products.quantity` representa existencias físicas. La cotización puede superar esa cantidad, pero la venta continúa validando el stock al momento de registrar la salida.
- El perfil de empresa muestra las asignaciones activas. El historial completo de asignaciones sigue almacenado en `equipment_company_assignments`, pero no se agregó una pantalla histórica en esta actualización.

## Validación

Se realizó comprobación sintáctica TypeScript/TSX de los archivos modificados. No se pudo completar `npm ci` dentro del entorno de trabajo y, por ello, no se ejecutó el build integral (`vite build` / `tsc --noEmit`). Antes de desplegar, ejecutar en una instalación local completa:

```powershell
npm ci
npm run build
```

No ejecutar migraciones: esta actualización no requiere cambios de esquema.
