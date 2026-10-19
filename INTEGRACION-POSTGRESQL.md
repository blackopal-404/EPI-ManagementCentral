# Integración PostgreSQL / Neon — EPIControl

Esta entrega conecta los servicios de la aplicación con la función `/.netlify/functions/api` en producción. En desarrollo (`npm run dev`) se mantienen los datos de demostración.

## Conexiones incluidas

- Catálogo de productos: lectura desde PostgreSQL, conversión de tipos y consulta de imágenes asociadas.
- Bodega: lectura, alta, edición, desactivación y movimientos de existencias desde la API.
- Sincronización de catálogo: al consultar el catálogo desde una sesión administrativa, los productos de Bodega que aún no tengan `product_id` se vinculan con un registro en `products`. Si falta una categoría o fabricante de referencia, se crea una referencia predeterminada.
- Equipos: consulta, alta, edición, retiro y lectura de historial.
- Inspecciones: consulta y registro con evento de trazabilidad.
- Categorías y fabricantes: lectura desde PostgreSQL.
- Usuarios y roles: lectura desde PostgreSQL; el correo de los usuarios solo se devuelve a administradores.
- Documentos técnicos: consulta por producto o equipo.
- Dashboard, inventario, alertas y búsqueda: se calculan usando datos consultados desde la API.
- Ventas: registro transaccional, validación de existencias, líneas de venta y movimientos de inventario.
- Cotizaciones: perfil de empresa persistente y guardado de cotizaciones con líneas.
- Reportes: conteos desde PostgreSQL y exportación CSV o impresión para guardar como PDF.

## Aplicación

1. Descomprime el ZIP dentro de tu carpeta actual `EPI-ManagementCentral`, permitiendo reemplazar los archivos incluidos.
2. Conserva tu `.env.local` y la carpeta `.git` existentes; no se incluyen en esta entrega para evitar sobrescribir credenciales o historial.
3. En PowerShell, desde la raíz del proyecto, ejecuta `npm run build`.
4. Si termina sin errores, sube los cambios a GitHub para que Netlify haga el despliegue.
5. En el sitio desplegado, inicia sesión como Magna, abre **Administración → Productos** para ejecutar la vinculación inicial de productos de Bodega, y luego prueba catálogo, equipos, cotizaciones y ventas.

## Variables de entorno

Conserva las variables de Netlify ya configuradas (`DATABASE_URL`, `GOOGLE_CLIENT_ID`, `MAGNA_EMAILS`, `VITE_GOOGLE_CLIENT_ID` y `VITE_MAGNA_EMAILS`). No pongas secretos en variables con prefijo `VITE_`.

## Validación

La comprobación estática de TypeScript del frontend y la comprobación de tipos de `netlify/functions/api.ts` pasaron en el entorno de preparación. No se pudo ejecutar el build completo de Vite aquí porque el ZIP original incluía dependencias nativas instaladas para Windows y esta validación se ejecutó en Linux. El despliegue y las operaciones SQL deben verificarse en tu entorno de Netlify/Neon antes de usarlo en operaciones reales.

## Alcance restante

La pantalla **Administración → Configuración** sigue siendo un marcador de posición porque no contiene todavía controles funcionales que conectar. La planificación de compras calcula recomendaciones a partir de los datos reales de Bodega, pero no crea órdenes de compra ni descuenta existencias.
