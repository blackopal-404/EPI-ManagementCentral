-- EPI-ManagementCentral: cuenta temporal de pruebas
-- Ejecutar SOLO después de confirmar que la migración 005_users_companies_settings.sql está aplicada.
-- Usuario: epi_test
-- Contraseña temporal: h9tNgUcn07QW9nX07YZJZAUj
-- Rol: administrador (acceso funcional amplio para pruebas)
-- Eliminar al terminar usando el bloque de limpieza incluido al final.

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='username') OR
     NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='password_hash') THEN
    RAISE EXCEPTION 'Falta aplicar la migración 005_users_companies_settings.sql';
  END IF;
  IF EXISTS (SELECT 1 FROM users WHERE lower(username)=lower('epi_test') OR lower(email)=lower('epi.test@invalid.local')) THEN
    RAISE EXCEPTION 'Ya existe el usuario temporal epi_test o su correo. No se modificó ningún registro.';
  END IF;
END $$;

INSERT INTO users (
  id, auth_provider, auth_subject, username, password_hash,
  full_name, email, role_id, status
)
SELECT
  gen_random_uuid()::text, 'local', NULL, 'epi_test', 'scrypt$3b5cde2a61ec9ff61fe404d927a9d72c$61edabd161fac148048239528501e7fba96642d1674628a289b661d4c25cf0a8f6c6af8fa87534d0998b40ffd2c24518ba48da791476f7e4ab82e5f6e872dc42',
  'Usuario temporal de pruebas', 'epi.test@invalid.local', r.id, 'activo'
FROM roles r
WHERE r.name='administrador';

COMMIT;

-- LIMPIEZA: ejecutar al terminar las pruebas.
-- DELETE FROM users WHERE username='epi_test' AND email='epi.test@invalid.local';
