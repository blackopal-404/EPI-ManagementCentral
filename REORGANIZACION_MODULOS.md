# Reorganización de navegación de EPI-ManagementCentral

## Estructura acordada

- Productos reúne el catálogo comercial, las existencias de bodega y las categorías mediante navegación interna.
- El inventario de unidades físicas serializadas se conserva en Gestión de equipos y se identifica como “Inventario de equipos”. No se confunde con el stock comercial.
- Cotizaciones, Ventas, Empresas, Equipos, Inspecciones y Reportes mantienen sus funcionalidades y rutas existentes.
- Los enlaces históricos `/admin/bodega`, `/admin/inventario` y `/admin/categorias` se conservan. La ruta administrativa antigua `/admin/inventario` ahora explica que el inventario individual está en `/inventario`.
- El menú inferior móvil queda como Equipos | Escanear | Empresas, con Escanear centrado y destacado. En la vista administrativa usa las rutas administrativas equivalentes.
- Reportes sigue disponible en la navegación principal, pero ya no ocupa un espacio del menú inferior.
- Se respetan los permisos: Productos aparece a usuarios con permisos de catálogo, bodega o categorías; cada vista secundaria conserva su permiso específico. Empresas se muestra a Magna/administradores o usuarios con permiso `companies`.

## Archivos principales modificados

- `src/components/layout/AppShell.tsx`
- `src/components/layout/AdminShell.tsx`
- `src/components/admin/ProductsModuleNav.tsx` (nuevo)
- `src/routes/admin/productos.tsx`
- `src/routes/admin/bodega.tsx`
- `src/routes/admin/inventario.tsx`
- `src/routes/admin/categorias.tsx`
- `src/routes/admin/index.tsx`
- `src/routes/inventario.tsx`
- `src/routes/__root.tsx`

## Validación

No se completó `npm ci` en el entorno de preparación por límite de ejecución. No se afirma que el build integral haya sido validado. Ejecutar localmente:

```powershell
npm ci
npm run build
```

No se realizaron despliegues ni cambios en Neon, GitHub o Netlify.
