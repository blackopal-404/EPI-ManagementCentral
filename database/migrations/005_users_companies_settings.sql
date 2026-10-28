-- EPIControl: usuarios locales, permisos configurables, empresas y asignación de equipos.
-- Ejecutar una sola vez en el SQL Editor de Neon antes del despliegue.
ALTER TABLE users ADD COLUMN IF NOT EXISTS username text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone text NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS identity_number text NOT NULL DEFAULT '';
CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique_ci ON users (lower(username)) WHERE username IS NOT NULL AND username <> '';
CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique_ci ON users (lower(email)) WHERE email IS NOT NULL AND email <> '';

ALTER TABLE roles DROP CONSTRAINT IF EXISTS roles_name_check;
ALTER TABLE roles ADD COLUMN IF NOT EXISTS label text NOT NULL DEFAULT '';
ALTER TABLE roles ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT '';
ALTER TABLE roles ADD COLUMN IF NOT EXISTS permissions jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE roles ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'activo';
ALTER TABLE roles ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE roles ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
UPDATE roles SET label=initcap(replace(name,'_',' ')) WHERE label='';

CREATE TABLE IF NOT EXISTS companies (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  rtn text NOT NULL UNIQUE,
  name text NOT NULL,
  contact_name text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'activa',
  notes text NOT NULL DEFAULT '',
  created_by text REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS companies_name_idx ON companies (lower(name));

CREATE TABLE IF NOT EXISTS equipment_company_assignments (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id text NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  equipment_id text NOT NULL REFERENCES equipment(id) ON DELETE RESTRICT,
  assigned_by text REFERENCES users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'activa',
  assigned_at timestamptz NOT NULL DEFAULT now(),
  returned_at timestamptz,
  notes text NOT NULL DEFAULT ''
);
CREATE UNIQUE INDEX IF NOT EXISTS equipment_one_active_company_idx ON equipment_company_assignments(equipment_id) WHERE status='activa';
CREATE INDEX IF NOT EXISTS equipment_company_assignments_company_idx ON equipment_company_assignments(company_id,status);

-- Ajustes básicos iniciales; ON CONFLICT evita sobrescribir las preferencias existentes.
INSERT INTO app_settings(key,value) VALUES
 ('app.name','"EPIControl"'::jsonb),
 ('app.company','"Vertical Safety HN"'::jsonb),
 ('app.timezone','"America/Tegucigalpa"'::jsonb),
 ('app.date_format','"DD/MM/YYYY"'::jsonb),
 ('security.session_days','7'::jsonb),
 ('notifications.inspection_reminders','true'::jsonb)
ON CONFLICT (key) DO NOTHING;

UPDATE roles SET permissions = CASE name
 WHEN 'magna' THEN '["equipment","inspections","inspection_reports","scanner","products","categories","warehouse","sales","purchases","quotes","inventory","reports","users","settings","companies","documents"]'::jsonb
 WHEN 'administrador' THEN '["equipment","inspections","inspection_reports","scanner","products","categories","warehouse","sales","purchases","quotes","inventory","reports","users","settings","companies","documents"]'::jsonb
 WHEN 'supervisor' THEN '["equipment","inspections","inspection_reports","scanner","products","warehouse","inventory","reports","companies","documents"]'::jsonb
 WHEN 'inspector' THEN '["equipment","inspections","inspection_reports","scanner","documents"]'::jsonb
 WHEN 'tecnico' THEN '["equipment","inspections","inspection_reports","scanner","documents"]'::jsonb
 ELSE '["equipment","inspections","inspection_reports","scanner","documents"]'::jsonb END
WHERE permissions='[]'::jsonb;
