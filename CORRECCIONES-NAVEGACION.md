# Correcciones de navegación y cotizador

## Cambios incluidos

- Se recuperó el acceso al cotizador desde `Administrativo > Cotizador`, mediante `/admin/cotizador`, reutilizando el formulario de cotizaciones existente.
- Se organizaron los menús en `Administrativo` y `Gestión del equipo`.
- Para Magna se muestran ambos grupos. Para los demás usuarios se muestra únicamente `Gestión del equipo`.
- Se añadió un reporte dedicado a inspecciones, sin mezclar ventas u otros reportes, con acción para imprimir o guardar como PDF.
- Se sustituyó el panel móvil basado en Sheet por un drawer controlado directamente, con capas explícitas para que el menú quede por encima del fondo oscuro.
- Se restringieron las rutas administrativas, catálogo, cotizaciones e inventario a Magna en el control de navegación del frontend.

## Archivos principales

- `src/components/layout/AdminShell.tsx`
- `src/components/layout/AppShell.tsx`
- `src/routes/__root.tsx`
- `src/routes/admin/cotizador.tsx`
- `src/routes/admin/reporte-inspecciones.tsx`
- `src/routes/reporte-inspecciones.tsx`
- `src/components/inspections/InspectionPrintReport.tsx`
- `src/routes/cotizaciones.tsx`
- `src/routes/admin/index.tsx`

## Validación

Ejecuta `npm run build` en un entorno con dependencias instaladas. TanStack Router genera el árbol de rutas al ejecutar Vite. Después prueba el menú en una pantalla móvil, el acceso al cotizador como Magna y la impresión del reporte de inspecciones.
