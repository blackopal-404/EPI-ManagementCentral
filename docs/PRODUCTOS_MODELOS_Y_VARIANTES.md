# Catálogo maestro de modelos y registro de inventario

## Conceptos
- `product_models`: ficha general única del modelo comercial (marca, modelo, descripción, características, modalidad de control y precio de venta de referencia).
- `warehouse_products`: SKU/variante y existencias. Cada SKU puede tener múltiples unidades si el producto se controla por cantidad.
- `products`: ficha técnica compatible que usa el sistema actual para cotizaciones, catálogo y relaciones de equipos. Al ingresar un SKU nuevo desde un modelo maestro, la API crea o vincula esta ficha compatible.
- `equipment`: unidad física serializada cuando se necesita trazabilidad individual.
- `product_price_history`: histórico de cambios del precio de venta de referencia del modelo.

## Implementación
1. Ejecuta primero `database/migrations/006_product_models.sql` en Neon SQL Editor.
2. Despliega la aplicación que contiene el nuevo endpoint `/product-models`.
3. En Productos > Catálogo, crea cada modelo una sola vez.
4. Selecciona el modo:
   - `Por cantidad / SKU`: consumibles o productos que se cuentan por cantidad.
   - `Unidad individual / número de serie`: equipos que deben tener trazabilidad individual.
5. En Productos > Existencias > Agregar producto, selecciona el modelo. El formulario completa nombre, descripción, imagen, precio de referencia y moneda.
6. Ingresa SKU, cantidad recibida, costo real, ubicación y proveedor.
7. Para equipos serializados, registra cada unidad física en Gestión de equipos con su número de serie. No se debe inventar un número de serie para productos por cantidad.

## Precios
- El precio de venta de referencia vive en `product_models`.
- Cada cambio desde el registro de inventario actualiza el precio de referencia del modelo y agrega una fila a `product_price_history`.
- Las cotizaciones guardadas conservan su propio precio histórico; no se deben recalcular al cambiar el catálogo.

## Migración y compatibilidad
- La migración 006 es aditiva; no elimina tablas ni columnas.
- Intenta crear un modelo maestro por combinación de marca + nombre + modelo de los productos existentes y vincular las filas de bodega coincidentes.
- Revisa los modelos migrados antes de importar una lista externa; la migración no puede deducir diferencias de variante que no estén explícitas en los datos antiguos.

## Importación de la tabla comercial del usuario
La tabla externa todavía no está incluida en este proyecto. No se han inventado ni importado productos. Usa `PRODUCTOS_IMPORT_TEMPLATE.csv` como guía de columnas; cuando se comparta el archivo real, hay que depurarlo y preparar una importación revisada para evitar duplicados.
