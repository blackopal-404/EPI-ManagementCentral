-- EPI-Central Management — PostgreSQL initial schema
-- Version: 001
-- IMPORTANT: schema only. It does not create provider credentials, backend endpoints,
-- users, demo data, or Netlify configuration. Run against a NEW/EMPTY database first.
BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS roles (
  id text PRIMARY KEY,
  name text NOT NULL UNIQUE CHECK (name IN ('administrador','supervisor','inspector','tecnico','usuario','magna')),
  label text NOT NULL,
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Identity is linked to a verified provider subject. Do not store Google ID tokens here.
CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  auth_provider text NOT NULL DEFAULT 'google' CHECK (auth_provider IN ('google','local','other')),
  auth_subject text,
  full_name text NOT NULL,
  email text NOT NULL,
  role_id text NOT NULL REFERENCES roles(id) ON UPDATE CASCADE,
  status text NOT NULL DEFAULT 'activo' CHECK (status IN ('activo','inactivo','suspendido')),
  location text,
  last_access_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_email_lowercase CHECK (email = lower(email)),
  CONSTRAINT users_provider_subject_unique UNIQUE (auth_provider, auth_subject)
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique_idx ON users (lower(email));
CREATE TRIGGER users_set_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Server-managed sessions; opaque tokens should be stored as hashes, never as raw cookies.
CREATE TABLE IF NOT EXISTS sessions (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  ip_address inet,
  user_agent text,
  CHECK (expires_at > created_at)
);
CREATE INDEX IF NOT EXISTS sessions_user_active_idx ON sessions(user_id, expires_at) WHERE revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS categories (
  id text PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  image_url text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'activa' CHECK (status IN ('activa','inactiva')),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER categories_set_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS manufacturers (
  id text PRIMARY KEY,
  name text NOT NULL UNIQUE,
  country text NOT NULL DEFAULT '',
  website text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER manufacturers_set_updated_at BEFORE UPDATE ON manufacturers FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS products (
  id text PRIMARY KEY,
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  sku text NOT NULL UNIQUE,
  category_id text NOT NULL REFERENCES categories(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  manufacturer_id text NOT NULL REFERENCES manufacturers(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  model text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  features jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(features) = 'array'),
  specifications jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(specifications) = 'array'),
  materials jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(materials) = 'array'),
  weight text NOT NULL DEFAULT '',
  dimensions text NOT NULL DEFAULT '',
  standards jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(standards) = 'array'),
  certifications jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(certifications) = 'array'),
  service_life text NOT NULL DEFAULT '',
  usage text NOT NULL DEFAULT '',
  equipment_type text NOT NULL DEFAULT '',
  warnings jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(warnings) = 'array'),
  status text NOT NULL DEFAULT 'borrador' CHECK (status IN ('activo','descontinuado','borrador')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS products_category_idx ON products(category_id);
CREATE INDEX IF NOT EXISTS products_manufacturer_idx ON products(manufacturer_id);
CREATE INDEX IF NOT EXISTS products_status_idx ON products(status);
CREATE TRIGGER products_set_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS product_images (
  id text PRIMARY KEY,
  product_id text NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url text NOT NULL,
  alt text NOT NULL DEFAULT '',
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS product_one_primary_image_idx ON product_images(product_id) WHERE is_primary;

CREATE TABLE IF NOT EXISTS equipment (
  id text PRIMARY KEY,
  internal_code text NOT NULL UNIQUE,
  serial_number text NOT NULL,
  product_id text NOT NULL REFERENCES products(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  status text NOT NULL CHECK (status IN ('activo','disponible','asignado','en_inspeccion','mantenimiento','proximo_vencer','vencido','fuera_servicio','retirado')),
  manufacturing_date date,
  purchase_date date,
  commissioning_date date,
  location text NOT NULL DEFAULT '',
  assigned_user_id text REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  last_inspection_date date,
  next_inspection_date date,
  service_life text NOT NULL DEFAULT '',
  notes text,
  qr_code text NOT NULL DEFAULT '',
  data_matrix_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(product_id, serial_number)
);
CREATE UNIQUE INDEX IF NOT EXISTS equipment_data_matrix_unique_idx ON equipment(data_matrix_code) WHERE data_matrix_code IS NOT NULL AND data_matrix_code <> '';
CREATE INDEX IF NOT EXISTS equipment_status_idx ON equipment(status);
CREATE INDEX IF NOT EXISTS equipment_location_idx ON equipment(location);
CREATE INDEX IF NOT EXISTS equipment_assigned_user_idx ON equipment(assigned_user_id);
CREATE TRIGGER equipment_set_updated_at BEFORE UPDATE ON equipment FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS equipment_assignments (
  id text PRIMARY KEY,
  equipment_id text NOT NULL REFERENCES equipment(id) ON DELETE RESTRICT,
  user_id text NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  returned_at timestamptz,
  location text NOT NULL DEFAULT '',
  assigned_by text REFERENCES users(id) ON DELETE SET NULL,
  returned_by text REFERENCES users(id) ON DELETE SET NULL,
  notes text,
  CHECK (returned_at IS NULL OR returned_at >= assigned_at)
);
CREATE UNIQUE INDEX IF NOT EXISTS equipment_single_active_assignment_idx ON equipment_assignments(equipment_id) WHERE returned_at IS NULL;
CREATE INDEX IF NOT EXISTS equipment_assignments_user_idx ON equipment_assignments(user_id, assigned_at DESC);

CREATE TABLE IF NOT EXISTS inspections (
  id text PRIMARY KEY,
  equipment_id text NOT NULL REFERENCES equipment(id) ON DELETE RESTRICT,
  inspector_id text NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  inspected_at date NOT NULL,
  result text NOT NULL CHECK (result IN ('aprobado','aprobado_con_observaciones','rechazado','pendiente')),
  observations text NOT NULL DEFAULT '',
  recommendations text,
  next_inspection_date date,
  photos jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(photos) = 'array'),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (next_inspection_date IS NULL OR next_inspection_date >= inspected_at)
);
CREATE INDEX IF NOT EXISTS inspections_equipment_date_idx ON inspections(equipment_id, inspected_at DESC);
CREATE INDEX IF NOT EXISTS inspections_next_date_idx ON inspections(next_inspection_date) WHERE next_inspection_date IS NOT NULL;

CREATE TABLE IF NOT EXISTS maintenance_records (
  id text PRIMARY KEY,
  equipment_id text NOT NULL REFERENCES equipment(id) ON DELETE RESTRICT,
  performed_at date NOT NULL,
  maintenance_type text NOT NULL CHECK (maintenance_type IN ('preventivo','correctivo','limpieza')),
  description text NOT NULL,
  responsible_id text NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS maintenance_equipment_date_idx ON maintenance_records(equipment_id, performed_at DESC);

CREATE TABLE IF NOT EXISTS equipment_history (
  id text PRIMARY KEY,
  equipment_id text NOT NULL REFERENCES equipment(id) ON DELETE RESTRICT,
  event_at timestamptz NOT NULL DEFAULT now(),
  event_type text NOT NULL CHECK (event_type IN ('inspeccion','asignacion','ubicacion','mantenimiento','estado','alta')),
  title text NOT NULL,
  detail text NOT NULL DEFAULT '',
  actor_user_id text REFERENCES users(id) ON DELETE SET NULL,
  actor_label text NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS equipment_history_equipment_date_idx ON equipment_history(equipment_id, event_at DESC);

CREATE TABLE IF NOT EXISTS technical_documents (
  id text PRIMARY KEY,
  product_id text REFERENCES products(id) ON DELETE CASCADE,
  equipment_id text REFERENCES equipment(id) ON DELETE CASCADE,
  document_type text NOT NULL CHECK (document_type IN ('manual','ficha_tecnica','certificado','declaracion_conformidad','otro')),
  title text NOT NULL,
  file_url text NOT NULL,
  file_size text NOT NULL DEFAULT '',
  version text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (product_id IS NOT NULL OR equipment_id IS NOT NULL),
  CHECK (product_id IS NULL OR equipment_id IS NULL)
);
CREATE INDEX IF NOT EXISTS technical_documents_product_idx ON technical_documents(product_id);
CREATE INDEX IF NOT EXISTS technical_documents_equipment_idx ON technical_documents(equipment_id);

-- Warehouse quantities are controlled by inventory_movements. The quantity column is a
-- cached balance maintained transactionally by the backend, not by browser-side code.
CREATE TABLE IF NOT EXISTS warehouse_products (
  id text PRIMARY KEY,
  product_id text REFERENCES products(id) ON UPDATE CASCADE ON DELETE SET NULL,
  sku text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  image_url text NOT NULL DEFAULT '',
  quantity integer NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  min_stock integer NOT NULL DEFAULT 0 CHECK (min_stock >= 0),
  cost_price numeric(14,2) NOT NULL DEFAULT 0 CHECK (cost_price >= 0),
  sale_price numeric(14,2) NOT NULL DEFAULT 0 CHECK (sale_price >= 0),
  currency text NOT NULL DEFAULT 'HNL' CHECK (currency IN ('HNL','USD','EUR')),
  location text NOT NULL DEFAULT '',
  supplier text,
  lead_time_days integer CHECK (lead_time_days IS NULL OR lead_time_days >= 0),
  safety_stock integer CHECK (safety_stock IS NULL OR safety_stock >= 0),
  max_stock integer CHECK (max_stock IS NULL OR max_stock >= 0),
  min_purchase_quantity integer CHECK (min_purchase_quantity IS NULL OR min_purchase_quantity >= 0),
  purchase_multiple integer CHECK (purchase_multiple IS NULL OR purchase_multiple >= 1),
  daily_demand_estimate numeric(14,3) CHECK (daily_demand_estimate IS NULL OR daily_demand_estimate >= 0),
  demand_estimate_notes text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS warehouse_products_active_idx ON warehouse_products(active);
CREATE INDEX IF NOT EXISTS warehouse_products_low_stock_idx ON warehouse_products(quantity, min_stock) WHERE active;
CREATE TRIGGER warehouse_products_set_updated_at BEFORE UPDATE ON warehouse_products FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS inventory_movements (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  warehouse_product_id text NOT NULL REFERENCES warehouse_products(id) ON DELETE RESTRICT,
  movement_type text NOT NULL CHECK (movement_type IN ('initial_balance','purchase_receipt','sale','assignment','return','adjustment','reversal','write_off')),
  quantity_delta integer NOT NULL CHECK (quantity_delta <> 0),
  unit_cost numeric(14,2) CHECK (unit_cost IS NULL OR unit_cost >= 0),
  reference_type text,
  reference_id text,
  reason text NOT NULL,
  created_by text REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  reversed_movement_id text REFERENCES inventory_movements(id) ON DELETE RESTRICT,
  UNIQUE(reversed_movement_id)
);
CREATE INDEX IF NOT EXISTS inventory_movements_product_date_idx ON inventory_movements(warehouse_product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS inventory_movements_reference_idx ON inventory_movements(reference_type, reference_id);

CREATE TABLE IF NOT EXISTS sales (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  sale_number text NOT NULL UNIQUE,
  sold_at timestamptz NOT NULL DEFAULT now(),
  customer_name text NOT NULL,
  customer_contact text NOT NULL DEFAULT '',
  payment_method text NOT NULL CHECK (payment_method IN ('efectivo','transferencia','tarjeta','credito','otro')),
  notes text NOT NULL DEFAULT '',
  subtotal numeric(14,2) NOT NULL CHECK (subtotal >= 0),
  discount numeric(14,2) NOT NULL DEFAULT 0 CHECK (discount >= 0 AND discount <= subtotal),
  total numeric(14,2) NOT NULL CHECK (total >= 0 AND total = subtotal - discount),
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('completed','voided','reversed')),
  created_by text REFERENCES users(id) ON DELETE SET NULL,
  created_by_label text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sales_sold_at_idx ON sales(sold_at DESC);

CREATE TABLE IF NOT EXISTS sale_lines (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  sale_id text NOT NULL REFERENCES sales(id) ON DELETE RESTRICT,
  warehouse_product_id text NOT NULL REFERENCES warehouse_products(id) ON DELETE RESTRICT,
  sku_snapshot text NOT NULL,
  name_snapshot text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric(14,2) NOT NULL CHECK (unit_price >= 0),
  unit_cost numeric(14,2) NOT NULL CHECK (unit_cost >= 0),
  line_total numeric(14,2) NOT NULL CHECK (line_total = quantity * unit_price),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sale_lines_sale_idx ON sale_lines(sale_id);

CREATE TABLE IF NOT EXISTS sale_payments (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  sale_id text NOT NULL REFERENCES sales(id) ON DELETE RESTRICT,
  payment_method text NOT NULL CHECK (payment_method IN ('efectivo','transferencia','tarjeta','credito','otro')),
  amount numeric(14,2) NOT NULL CHECK (amount >= 0),
  reference text,
  paid_at timestamptz NOT NULL DEFAULT now(),
  received_by text REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS sale_payments_sale_idx ON sale_payments(sale_id);

CREATE TABLE IF NOT EXISTS quotes (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  quote_number text UNIQUE,
  customer_company text NOT NULL DEFAULT '',
  customer_contact text NOT NULL DEFAULT '',
  customer_place text NOT NULL DEFAULT '',
  quote_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text NOT NULL DEFAULT '',
  currency text NOT NULL DEFAULT 'HNL' CHECK (currency IN ('HNL','USD','EUR')),
  subtotal numeric(14,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','accepted','rejected','expired','converted')),
  created_by text REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER quotes_set_updated_at BEFORE UPDATE ON quotes FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS quote_lines (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  quote_id text NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  warehouse_product_id text REFERENCES warehouse_products(id) ON DELETE SET NULL,
  sku_snapshot text NOT NULL DEFAULT '',
  name_snapshot text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric(14,2) NOT NULL CHECK (unit_price >= 0),
  line_total numeric(14,2) GENERATED ALWAYS AS (quantity * unit_price) STORED
);
CREATE INDEX IF NOT EXISTS quote_lines_quote_idx ON quote_lines(quote_id);

CREATE TABLE IF NOT EXISTS quote_company_profile (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  name text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  logo_url text NOT NULL DEFAULT '',
  updated_by text REFERENCES users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS purchase_plans (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name text NOT NULL,
  planning_mode text NOT NULL CHECK (planning_mode IN ('reorder','coverage')),
  horizon_days integer NOT NULL CHECK (horizon_days >= 1),
  demand_multiplier numeric(8,3) NOT NULL DEFAULT 1 CHECK (demand_multiplier >= 0),
  budget numeric(14,2) CHECK (budget IS NULL OR budget >= 0),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved','ordered','cancelled','received')),
  notes text NOT NULL DEFAULT '',
  created_by text REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER purchase_plans_set_updated_at BEFORE UPDATE ON purchase_plans FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS purchase_plan_lines (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  purchase_plan_id text NOT NULL REFERENCES purchase_plans(id) ON DELETE CASCADE,
  warehouse_product_id text NOT NULL REFERENCES warehouse_products(id) ON DELETE RESTRICT,
  quantity_suggested integer NOT NULL DEFAULT 0 CHECK (quantity_suggested >= 0),
  quantity_ordered integer CHECK (quantity_ordered IS NULL OR quantity_ordered >= 0),
  unit_cost_estimate numeric(14,2) NOT NULL DEFAULT 0 CHECK (unit_cost_estimate >= 0),
  status text NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed','approved','ordered','received','cancelled')),
  notes text NOT NULL DEFAULT '',
  UNIQUE(purchase_plan_id, warehouse_product_id)
);

CREATE TABLE IF NOT EXISTS audit_log (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  actor_user_id text REFERENCES users(id) ON DELETE SET NULL,
  actor_email text NOT NULL DEFAULT '',
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  request_id text,
  ip_address inet,
  user_agent text,
  before_data jsonb,
  after_data jsonb,
  reason text
);
CREATE INDEX IF NOT EXISTS audit_log_time_idx ON audit_log(occurred_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_entity_idx ON audit_log(entity_type, entity_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_actor_idx ON audit_log(actor_user_id, occurred_at DESC);

CREATE TABLE IF NOT EXISTS app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  description text NOT NULL DEFAULT '',
  updated_by text REFERENCES users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Safe initial role catalog only; no users, products, sales, equipment, or demo records.
INSERT INTO roles (id, name, label, description) VALUES
  ('role-administrador', 'administrador', 'Administrador', 'Administración general del sistema.'),
  ('role-supervisor', 'supervisor', 'Supervisor', 'Supervisa inventario, asignaciones e inspecciones.'),
  ('role-inspector', 'inspector', 'Inspector', 'Registra inspecciones de equipos.'),
  ('role-tecnico', 'tecnico', 'Técnico', 'Registra mantenimientos y cambios de estado.'),
  ('role-usuario', 'usuario', 'Usuario', 'Consulta equipos y documentación autorizada.'),
  ('role-magna', 'magna', 'Magna', 'Acceso administrativo de bodega sujeto a autorización del servidor.')
ON CONFLICT (id) DO NOTHING;

COMMIT;
