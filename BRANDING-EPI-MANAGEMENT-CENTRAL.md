# Identidad visual: EPI Management Central

- El icono de la aplicación, favicon, iconos PWA y logotipo dentro de los menús utilizan `public/epi-management-central-logo.png`.
- `src/components/layout/AppShell.tsx` y `src/components/layout/AdminShell.tsx` muestran la identidad de EPI Management Central en sus menús de escritorio y móviles.
- El componente administrativo legado `src/components/admin/AppShell.tsx` también utiliza el logo de EPI Management Central en sus menús para evitar inconsistencias si vuelve a utilizarse.
- El logo de Vertical Safety (`public/vertical-safety-logo.png`) se conserva en los lugares externos al menú, como el encabezado de la aplicación, la pantalla de inicio de sesión y los documentos de cotización.
- Los iconos PWA se generan desde la imagen entregada: `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`, `favicon-32x32.png` y `favicon.ico`.

No requiere cambios en la base de datos ni migraciones SQL.
