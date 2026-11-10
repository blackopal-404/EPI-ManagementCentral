-- EPI Management Central — revisión de registros de prueba
-- SOLO LECTURA: ejecutar antes de decidir cualquier eliminación.
-- No borra empresas, equipos, usuarios, productos ni historial.

-- 1) SKU temporal conocido y modelo de prueba.
SELECT
  wp.id AS warehouse_product_id,
  wp.sku,
  wp.name AS warehouse_name,
  wp.quantity,
  wp.product_id,
  wp.product_model_id,
  pm.name AS model_name,
  pm.brand,
  pm.model
FROM warehouse_products wp
LEFT JOIN product_models pm ON pm.id = wp.product_model_id
WHERE wp.sku = '111111111111'
   OR lower(wp.name) = 'prueba'
   OR lower(COALESCE(pm.name, '')) = 'prueba';

-- 2) Producto maestro/producto de catálogo con nombre de prueba.
SELECT id, name, code, sku, status
FROM products
WHERE lower(name) LIKE '%prueba%'
   OR lower(model) LIKE '%prueba%'
   OR lower(code) LIKE '%test%'
   OR lower(sku) LIKE '%test%';

SELECT id, name, brand, model, reference_sale_price, currency
FROM product_models
WHERE lower(name) LIKE '%prueba%'
   OR lower(model) LIKE '%prueba%';

-- 3) Usuario temporal conocido.
SELECT id, username, email, status
FROM users
WHERE lower(COALESCE(username, '')) = 'epi_test'
   OR lower(email) = 'epi.test@invalid.local';

-- 4) Empresa que aparece en la captura. Se muestra también su equipo asignado.
-- No eliminarla automáticamente: el registro tiene un equipo asociado.
SELECT
  c.id AS company_id,
  c.name,
  c.rtn,
  c.contact_name,
  c.phone,
  e.internal_code,
  e.serial_number,
  a.status AS assignment_status
FROM companies c
LEFT JOIN equipment_company_assignments a ON a.company_id = c.id
LEFT JOIN equipment e ON e.id = a.equipment_id
WHERE lower(c.name) = 'so cool tech';

-- 5) Dependencias de un posible producto de prueba antes de borrarlo.
-- Devuelve referencias que deben preservarse o resolverse antes de eliminar.
SELECT 'equipment' AS source, count(*) AS references_count
FROM equipment e JOIN products p ON p.id=e.product_id
WHERE lower(p.name) LIKE '%prueba%'
UNION ALL
SELECT 'quote_lines', count(*)
FROM quote_lines ql JOIN warehouse_products wp ON wp.id=ql.warehouse_product_id
WHERE wp.sku = '111111111111' OR lower(wp.name) = 'prueba'
UNION ALL
SELECT 'sale_lines', count(*)
FROM sale_lines sl JOIN warehouse_products wp ON wp.id=sl.warehouse_product_id
WHERE wp.sku = '111111111111' OR lower(wp.name) = 'prueba';
