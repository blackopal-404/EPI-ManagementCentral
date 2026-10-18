# EPIControl / Safety Gear Hub

> **Requisitos de entorno:** usa Node.js 20.19+ o 22.12+ (recomendado Node.js 22.12 o superior) y npm actualizado. EPIControl utiliza Vite 8 para mantener compatibilidad con la versión actual de TanStack Start.


Aplicación independiente para gestión, control y trazabilidad de EPP/EPI. La V1 funciona localmente con Node.js y Mock Data; XAMPP/MySQL queda reservado para la siguiente fase.

## Desarrollo local

```powershell
npm install
npm run dev
```

Abrir `http://localhost:8080`.

## Acceso con Google

La aplicación utiliza Google Identity Services para el login de producción. Crea `.env.local` a partir de `.env.example` y define:

```env
VITE_GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
VITE_MAGNA_EMAILS=tu-correo@gmail.com
```

En Google Cloud Console, el origen autorizado de desarrollo debe incluir `http://localhost:8080` y el dominio de producción cuando exista. El botón **Entrar como Magna (solo local)** únicamente aparece en desarrollo para facilitar las pruebas; no sustituye la autenticación real.

El rol Magna se asigna por correo autorizado. En producción la autorización definitiva debe validarse también en el backend; ocultar una ruta en React no constituye una barrera de seguridad.

## Módulos nuevos de esta V1

- **Bodega (Magna):** inventario de distribución con existencia, stock mínimo, costo, venta, margen, ubicación y proveedor. Ahora incluye plazo de reposición, stock de seguridad, stock máximo opcional, compra mínima, múltiplo de compra y estimación manual de demanda. Los cambios se conservan en `localStorage` mientras usamos Mock Data.
- **Planificador de compras (Magna):** calcula sugerencias por horizonte de 30, 60, 90 o 180 días o por punto de reposición; permite ajustar cantidades, introducir presupuesto, simular multiplicadores de demanda y exportar el plan a CSV. No crea órdenes de compra ni modifica existencias.
- **Monedas:** HNL es la moneda predeterminada. Los importes en USD/EUR se mantienen separados y no se suman al presupuesto HNL hasta incorporar un tipo de cambio documentado.
- **Cotizaciones:** carrito interno con productos de bodega, cantidades, datos del cliente y documento imprimible A4 con imagen, descripción, precio unitario y total por cantidad. Desde el diálogo de impresión del navegador se puede guardar como PDF.
- **QR/Data Matrix:** lector real mediante cámara con `BarcodeDetector` del navegador, además de simulación y búsqueda manual. En Chrome/Edge de Android funciona con la cámara trasera cuando el sitio se sirve en `localhost` o HTTPS. Si el navegador no implementa `BarcodeDetector`, se mantiene el ingreso manual.
- **Login:** Google Identity Services + rol Magna por correo autorizado.
- **Responsive:** navegación móvil, tablas con scroll horizontal y formularios adaptados a pantallas pequeñas.

## Producción

```powershell
npm run build
npm run start
```

El servidor de producción usa el output de Nitro (`.output/server/index.mjs`) y no depende de Lovable.

## Arquitectura

`React/TanStack Start → Services → Mock Data`.

La siguiente fase puede sustituir Mock Data por API y MySQL sin rehacer las pantallas.

## Alcance actual del planificador

La demanda se introduce como **estimación manual** y queda etiquetada como tal. Aún no se calcula a partir de ventas reales, porque el proyecto no cuenta todavía con un libro de movimientos de bodega ni con un historial de ventas/compras conectado. Si no hay estimación, el sistema indica que faltan datos y no inventa una demanda. Las existencias actuales siguen siendo un valor editable de bodega; antes de usar el módulo en producción hay que implementar el registro auditable de movimientos, reservas, pedidos pendientes y recepción de compras, y trasladar la persistencia de `localStorage` a una API/base de datos.


## Escaneo de equipos
El lector de cámara utiliza `@zxing/browser` para admitir **Data Matrix y QR**. Los códigos Data Matrix pueden entregar directamente el número de serie, que el servicio de equipos utiliza para localizar la unidad.


## Registro de ventas (V10)

La sección **Administración → Ventas y carrito** permite seleccionar productos activos de Bodega, registrar cliente y forma de pago, aplicar descuento, confirmar una venta, descontar existencias y consultar/exportar el historial de ventas a CSV. Los registros y existencias de esta versión de demostración se guardan en `localStorage` del navegador; no constituyen persistencia compartida ni contabilidad de producción. Para producción, la confirmación de venta y la actualización del inventario deben migrarse a una transacción del backend/base de datos.


## Preparación para producción

Consulta [`docs/production/README.md`](docs/production/README.md) antes de desplegar. En un build de producción los datos de demostración están desactivados y `localStorage` no se utiliza como persistencia de negocio. La API y la base de datos todavía deben implementarse y conectarse; esta entrega no debe tratarse como lista para registrar operaciones reales.
