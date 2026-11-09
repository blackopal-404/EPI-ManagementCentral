-- Catálogo maestro de modelos: una ficha técnica por modelo comercial.
-- Compatible con los registros existentes; no elimina ni reescribe productos actuales.
BEGIN;

CREATE TABLE IF NOT EXISTS product_models (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name text NOT NULL,
  brand text NOT NULL DEFAULT '',
  model text NOT NULL DEFAULT '',
  category_id text REFERENCES categories(id) ON UPDATE CASCADE ON DELETE SET NULL,
  manufacturer_id text REFERENCES manufacturers(id) ON UPDATE CASCADE ON DELETE SET NULL,
  description text NOT NULL DEFAULT '',
  features jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(features)='array'),
  specifications jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(specifications)='array'),
  materials jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(materials)='array'),
  standards jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(standards)='array'),
  equipment_type text NOT NULL DEFAULT '',
  usage text NOT NULL DEFAULT '',
  weight text NOT NULL DEFAULT '',
  dimensions text NOT NULL DEFAULT '',
  service_life text NOT NULL DEFAULT '',
  image_url text NOT NULL DEFAULT '',
  tracking_mode text NOT NULL DEFAULT 'quantity' CHECK (tracking_mode IN ('quantity','individual')),
  reference_sale_price numeric(14,2) NOT NULL DEFAULT 0 CHECK (reference_sale_price >= 0),
  currency text NOT NULL DEFAULT 'HNL' CHECK (currency IN ('HNL','USD','EUR')),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS product_models_active_idx ON product_models(active);
CREATE INDEX IF NOT EXISTS product_models_name_idx ON product_models(name);

ALTER TABLE warehouse_products
  ADD COLUMN IF NOT EXISTS product_model_id text REFERENCES product_models(id) ON UPDATE CASCADE ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS warehouse_products_model_idx ON warehouse_products(product_model_id);

CREATE TABLE IF NOT EXISTS product_price_history (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  product_model_id text NOT NULL REFERENCES product_models(id) ON DELETE CASCADE,
  price numeric(14,2) NOT NULL CHECK (price >= 0),
  currency text NOT NULL DEFAULT 'HNL' CHECK (currency IN ('HNL','USD','EUR')),
  price_type text NOT NULL DEFAULT 'sale' CHECK (price_type IN ('sale','cost')),
  source text NOT NULL DEFAULT 'manual',
  recorded_at timestamptz NOT NULL DEFAULT now(),
  recorded_by text REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS product_price_history_model_idx
  ON product_price_history(product_model_id, price_type, recorded_at DESC);

-- Vincula automáticamente modelos existentes por fabricante + modelo + nombre,
-- dejando sin vincular los casos ambiguos para revisión manual.
INSERT INTO product_models (name, brand, model, category_id, manufacturer_id, description,
  features, specifications, materials, standards, equipment_type, usage, weight, dimensions,
  service_life, image_url, reference_sale_price, currency)
SELECT DISTINCT ON (p.id)
  p.name, COALESCE(m.name,''), p.model, p.category_id, p.manufacturer_id, p.description,
  p.features, p.specifications, p.materials, p.standards, p.equipment_type, p.usage,
  p.weight, p.dimensions, p.service_life,
  COALESCE((SELECT pi.url FROM product_images pi WHERE pi.product_id=p.id ORDER BY pi.is_primary DESC, pi.sort_order LIMIT 1),''),
  COALESCE((SELECT wp.sale_price FROM warehouse_products wp WHERE wp.product_id=p.id ORDER BY wp.updated_at DESC LIMIT 1),0),
  COALESCE((SELECT wp.currency FROM warehouse_products wp WHERE wp.product_id=p.id ORDER BY wp.updated_at DESC LIMIT 1),'HNL')
FROM products p
LEFT JOIN manufacturers m ON m.id=p.manufacturer_id
WHERE NOT EXISTS (
  SELECT 1 FROM product_models pm
  WHERE lower(pm.name)=lower(p.name) AND lower(pm.brand)=lower(COALESCE(m.name,''))
    AND lower(pm.model)=lower(p.model)
);

UPDATE warehouse_products wp
SET product_model_id=pm.id
FROM products p
JOIN manufacturers m ON m.id=p.manufacturer_id
JOIN product_models pm ON lower(pm.name)=lower(p.name)
 AND lower(pm.brand)=lower(m.name) AND lower(pm.model)=lower(p.model)
WHERE wp.product_id=p.id AND wp.product_model_id IS NULL;

COMMIT;
