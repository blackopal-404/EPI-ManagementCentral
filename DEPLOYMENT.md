# Despliegue de EPIControl

## Local

Node.js ejecuta TanStack Start. XAMPP/Apache no es necesario para servir la app durante desarrollo, aunque XAMPP puede ejecutar MySQL cuando pasemos a datos reales.

```powershell
npm install
npm run dev
```

## Producción Node.js

```powershell
npm install
npm run build
npm run start
```

La aplicación queda servida desde `.output/server/index.mjs` mediante Nitro.

## Hostinger

Cuando lleguemos al despliegue, elegir un plan/entorno de Hostinger que soporte Node.js. No subir esta aplicación a un hosting PHP estático esperando que TanStack Start funcione como Apache.

## Seguridad Magna

`VITE_MAGNA_EMAILS` solo controla la experiencia frontend. La autorización real para modificar inventario de bodega debe implementarse en el backend mediante sesión verificada y autorización por rol. Nunca debemos confiar en un valor de `localStorage` para proteger datos reales.


## Netlify

Para el despliegue Netlify de TanStack Start, consulta `NETLIFY_DEPLOY.md`. La configuración `netlify.toml` usa `npm run build` y `dist/client`; `vite.config.ts` incorpora `@netlify/vite-plugin-tanstack-start`. Esta configuración no implica que el backend de negocio o la base de datos estén implementados.
