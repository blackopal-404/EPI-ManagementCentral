-- Actualiza el nombre visible de la aplicación sin sobrescribir
-- un nombre personalizado que ya haya configurado el administrador.
UPDATE app_settings
SET value = '"EPI Management Central"'::jsonb
WHERE key = 'app.name'
  AND value = '"EPIControl"'::jsonb;
