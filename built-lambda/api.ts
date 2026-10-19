import type { Handler, HandlerEvent, HandlerResponse } from '@netlify/functions';
import { Pool } from 'pg';
import { createHash, randomBytes, randomUUID } from 'node:crypto';

const COOKIE_NAME = 'epi_session';
const SESSION_DAYS = 7;
let pool: Pool | undefined;

type AppRole = 'administrador' | 'supervisor' | 'inspector' | 'tecnico' | 'usuario' | 'magna';
type SessionUser = { id: string; email: string; fullName: string; role: AppRole; status: string };

function db(): Pool {
  if (pool) return pool;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL no está configurada en el entorno del servidor.');
  pool = new Pool({ connectionString, max: 5, idleTimeoutMillis: 10_000, connectionTimeoutMillis: 8_000, ssl: connectionString.includes('localhost') ? undefined : { rejectUnauthorized: true } });
  pool.on('error', (error) => console.error('PostgreSQL pool error', error));
  return pool;
}

function json(statusCode: number, data: unknown, extraHeaders: Record<string, string> = {}): HandlerResponse {
  return { statusCode, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', 'referrer-policy': 'same-origin', ...extraHeaders }, body: JSON.stringify(data) };
}
function readCookie(event: HandlerEvent, name: string): string | undefined {
  const raw = event.headers.cookie ?? event.headers.Cookie ?? '';
  for (const item of raw.split(';')) { const [key, ...value] = item.trim().split('='); if (key === name) { try { return decodeURIComponent(value.join('=')); } catch { return undefined; } } }
  return undefined;
}
function cookie(value: string, maxAge: number): string {
  return `${COOKIE_NAME}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}
function hash(value: string): string { return createHash('sha256').update(value).digest('hex'); }
function sameOrigin(event: HandlerEvent): boolean {
  const origin = event.headers.origin;
  if (!origin) return true; // non-browser clients still require a valid session for protected actions
  const host = event.headers.host;
  if (!host) return false;
  try { const parsed = new URL(origin); return parsed.host.toLowerCase() === host.toLowerCase(); } catch { return false; }
}
function body(event: HandlerEvent): Record<string, unknown> {
  if (!event.body) return {};
  try { const parsed: unknown = JSON.parse(event.body); return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {}; } catch { return {}; }
}
function text(value: unknown, max = 500): string { return typeof value === 'string' ? value.trim().slice(0, max) : ''; }
function admin(user: SessionUser): boolean { return user.role === 'magna' || user.role === 'administrador'; }

async function getSession(event: HandlerEvent): Promise<SessionUser | null> {
  const token = readCookie(event, COOKIE_NAME);
  if (!token || token.length < 32) return null;
  const result = await db().query<{ id: string; email: string; full_name: string; role: AppRole; status: string }>(
    `SELECT u.id, u.email, u.full_name, r.name AS role, u.status
       FROM sessions s JOIN users u ON u.id = s.user_id JOIN roles r ON r.id = u.role_id
      WHERE s.token_hash = $1 AND s.revoked_at IS NULL AND s.expires_at > now() AND u.status = 'activo'
      LIMIT 1`, [hash(token)]);
  const row = result.rows[0];
  return row ? { id: row.id, email: row.email, fullName: row.full_name, role: row.role, status: row.status } : null;
}
async function audit(userId: string | null, action: string, entity: string, entityId: string | null, details: unknown, event: HandlerEvent) {
  try { await db().query(`INSERT INTO audit_log (actor_user_id, actor_email, action, entity_type, entity_id, ip_address, user_agent, after_data) VALUES ($1, COALESCE((SELECT email FROM users WHERE id = $1), ''), $2, $3, $4, NULLIF($5, '')::inet, $6, $7::jsonb)`, [userId, action, entity, entityId, event.headers['x-nf-client-connection-ip'] ?? '', (event.headers['user-agent'] ?? '').slice(0, 500), JSON.stringify(details ?? {})]); }
  catch (error) { console.error('Audit log write failed', error); }
}

async function googleLogin(event: HandlerEvent): Promise<HandlerResponse> {
  if (!sameOrigin(event)) return json(403, { error: 'Origen no permitido.' });
  const credential = text(body(event).credential, 10_000);
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!credential || !clientId) return json(400, { error: 'Falta la credencial de Google o la configuración del servidor.' });
  const verify = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`, { signal: AbortSignal.timeout(8000) });
  if (!verify.ok) return json(401, { error: 'La credencial de Google no es válida.' });
  const claims = await verify.json() as { aud?: string; sub?: string; email?: string; email_verified?: boolean | string; name?: string; picture?: string; exp?: string };
  const email = text(claims.email, 320).toLowerCase();
  if (claims.aud !== clientId || !claims.sub || !email || !(claims.email_verified === true || claims.email_verified === 'true')) return json(401, { error: 'No se pudo verificar la identidad de Google.' });
  const magnaEmails = (process.env.MAGNA_EMAILS ?? '').split(',').map((x) => x.trim().toLowerCase()).filter(Boolean);
  const isMagna = magnaEmails.includes(email);
  const roleName: AppRole = isMagna ? 'magna' : 'usuario';
  const role = await db().query<{ id: string }>('SELECT id FROM roles WHERE name = $1 LIMIT 1', [roleName]);
  if (!role.rows[0]) return json(500, { error: 'Falta el rol inicial en PostgreSQL. Ejecuta la migración de esquema.' });
  const userResult = await db().query<{ id: string; status: string }>(
    `INSERT INTO users (id, auth_provider, auth_subject, full_name, email, role_id, status, last_access_at)
     VALUES (gen_random_uuid()::text, 'google', $1, $2, $3, $4, 'activo', now())
     ON CONFLICT (auth_provider, auth_subject) DO UPDATE SET full_name = EXCLUDED.full_name, email = EXCLUDED.email, last_access_at = now(), updated_at = now()
     RETURNING id, status`, [claims.sub, text(claims.name, 200) || email.split('@')[0], email, role.rows[0].id]);
  const user = userResult.rows[0];
  if (!user || user.status !== 'activo') return json(403, { error: 'La cuenta está desactivada. Contacta al administrador.' });
  // Role is derived server-side from the allowlist on every login; never trust a browser-supplied role.
  await db().query('UPDATE users SET role_id = $1 WHERE id = $2', [role.rows[0].id, user.id]);
  const rawToken = randomBytes(32).toString('base64url');
  await db().query(`INSERT INTO sessions (id, user_id, token_hash, expires_at, ip_address, user_agent)
    VALUES (gen_random_uuid()::text, $1, $2, now() + ($3 * interval '1 day'), NULLIF($4, '')::inet, $5)`, [user.id, hash(rawToken), SESSION_DAYS, event.headers['x-nf-client-connection-ip'] ?? '', (event.headers['user-agent'] ?? '').slice(0, 500)]);
  await audit(user.id, 'login', 'session', null, { provider: 'google' }, event);
  return json(200, { user: { id: user.id, email, name: text(claims.name, 200) || email.split('@')[0], picture: text(claims.picture, 1000), role: roleName } }, { 'set-cookie': cookie(rawToken, SESSION_DAYS * 86400) });
}


type ColumnInfo = { column_name: string; data_type: string; udt_name: string; is_nullable: string; column_default: string | null; is_identity: string };
const columnCache = new Map<string, ColumnInfo[]>();
const tableAllowlist = new Set(['products','categories','manufacturers','product_images','warehouse_products','equipment','equipment_history','inspections','users','roles','technical_documents','inventory_movements','sales','sale_lines','sale_payments','quotes','quote_lines','purchase_plans','purchase_plan_lines','app_settings']);
const aliases: Record<string, string[]> = {
  category_id: ['categoryId'], manufacturer_id: ['manufacturerId'], product_id: ['productId'], image_url: ['image','imageUrl'], features_json: ['features'], specifications_json: ['specifications'], standards_json: ['standards'], warnings_json: ['warnings'], materials_json: ['materials'],
  sort_order: ['order','sortOrder'], full_name: ['fullName','name'], last_access_at: ['lastAccess'], created_at: ['createdAt'], updated_at: ['updatedAt'],
  internal_code: ['internalCode'], serial_number: ['serialNumber'], manufacturing_date: ['manufacturingDate'], purchase_date: ['purchaseDate'],
  commissioning_date: ['commissioningDate'], assigned_user_id: ['assignedUserId'], last_inspection_date: ['lastInspectionDate'], next_inspection_date: ['nextInspectionDate'],
  service_life: ['serviceLife'], qr_code: ['qrCode'], data_matrix_code: ['dataMatrixCode'], equipment_id: ['equipmentId'], inspector_id: ['inspectorId'],
  inspection_date: ['date','inspectionDate'], observations: ['observations'], recommendations: ['recommendations'],
  file_url: ['fileUrl'], file_size: ['fileSize'], sale_number: ['saleNumber'], sold_at: ['soldAt'], customer_name: ['customerName'],
  customer_contact: ['customerContact'], payment_method: ['paymentMethod'], created_by: ['createdBy'], sale_id: ['saleId'], warehouse_product_id: ['warehouseProductId'],
  unit_price: ['unitPrice'], unit_cost: ['unitCost'], line_total: ['lineTotal'], subtotal: ['subtotal'], discount: ['discount'], total: ['total'],
  quote_number: ['quoteNumber'], company_name: ['companyName'], contact_name: ['contactName'], quote_date: ['date','quoteDate'], place: ['place'], purchase_plan_id: ['purchasePlanId'], suggested_quantity: ['suggestedQuantity'], line_cost: ['lineCost'],
  lead_time_days: ['leadTimeDays'], min_stock: ['minStock'], cost_price: ['costPrice'], sale_price: ['salePrice'], safety_stock: ['safetyStock'], max_stock: ['maxStock'],
  min_purchase_quantity: ['minPurchaseQuantity'], purchase_multiple: ['purchaseMultiple'], daily_demand_estimate: ['dailyDemandEstimate'], demand_estimate_notes: ['demandEstimateNotes'],
  actor_user_id: ['actorUserId'], responsible_id: ['responsibleId'], assigned_by: ['assignedBy'], returned_by: ['returnedBy'],
};
function camel(name: string): string { return name.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase()); }
function quoteIdent(value: string): string { return '"' + value.replace(/"/g, '""') + '"'; }
async function tableColumns(table: string, executor: Pick<Pool, 'query'> | { query: Pool['query'] }): Promise<ColumnInfo[]> {
  if (!tableAllowlist.has(table)) throw new Error('Tabla no permitida.');
  const cached = columnCache.get(table);
  if (cached) return cached;
  const result = await executor.query<ColumnInfo>(`SELECT column_name, data_type, udt_name, is_nullable, column_default, is_identity FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position`, [table]);
  if (!result.rows.length) throw new Error(`No existe la tabla ${table} en PostgreSQL.`);
  columnCache.set(table, result.rows);
  return result.rows;
}
function fallbackValue(column: ColumnInfo, record: Record<string, unknown>): unknown {
  const n = column.column_name;
  if (n === 'id') return randomUUID();
  if (n === 'slug') return text(record.slug,180) || text(record.name,180).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') || randomUUID();
  if (n === 'code' || n === 'sku') return text(record.sku,80) || text(record.code,80) || randomUUID().slice(0,8).toUpperCase();
  if (n === 'model') return text(record.name,180);
  if (n === 'status') return 'activo';
  if (n === 'active') return true;
  if (n === 'sort_order' || n === 'quantity' || n === 'min_stock' || n === 'cost_price' || n === 'sale_price' || n === 'price' || n === 'cost' || n === 'stock' || n === 'minimum_stock') return 0;
  if (n.endsWith('_at') || n.endsWith('_date')) return new Date();
  if (column.data_type === 'boolean') return false;
  if (['smallint','integer','bigint','numeric','real','double precision'].includes(column.data_type)) return 0;
  if (column.data_type === 'json' || column.data_type === 'jsonb') return n.includes('spec') || n.includes('feature') || n.includes('standard') || n.includes('warning') || n.includes('material') ? [] : {};
  return '';
}
function valueForColumn(column: ColumnInfo, input: Record<string, unknown>): { found: boolean; value: unknown } {
  const names = [column.column_name, camel(column.column_name), ...(aliases[column.column_name] ?? [])];
  for (const name of names) if (Object.prototype.hasOwnProperty.call(input, name) && input[name] !== undefined) {
    let value = input[name];
    if ((column.data_type === 'json' || column.data_type === 'jsonb') && value !== null && typeof value !== 'string') value = JSON.stringify(value);
    return { found: true, value };
  }
  return { found: false, value: undefined };
}
async function enumValues(column: ColumnInfo, executor: { query: Pool['query'] }): Promise<string[]> {
  if (column.data_type !== 'USER-DEFINED') return [];
  try {
    const result = await executor.query<{ enumlabel: string }>(`SELECT e.enumlabel FROM pg_type t JOIN pg_enum e ON e.enumtypid=t.oid WHERE t.typname=$1 ORDER BY e.enumsortorder`, [column.udt_name]);
    return result.rows.map(row => row.enumlabel);
  } catch { return []; }
}
function enumFallback(value: unknown, choices: string[]): unknown {
  if (!choices.length || typeof value !== 'string' || choices.includes(value)) return value;
  const lower = value.toLowerCase();
  const variants: Record<string,string[]> = {
    activo: ['activo','activa','active','available'], activa: ['activa','activo','active'], active: ['active','activo','activa'],
    completada: ['completada','completado','completed'], completed: ['completed','completada','completado'],
    disponible: ['disponible','available','activo','active'], sale: ['sale','venta','salida','outbound'],
    initial_balance: ['initial_balance','saldo_inicial','entrada','adjustment'], adjustment: ['adjustment','ajuste','entrada','salida'],
  };
  for (const candidate of variants[lower] ?? [lower]) if (choices.includes(candidate)) return candidate;
  return choices[0];
}
async function dynamicWrite(executor: { query: Pool['query'] }, table: string, input: Record<string, unknown>, upsert: boolean | string = false): Promise<Record<string, unknown>> {
  const columns = await tableColumns(table, executor as Pick<Pool,'query'>);
  const values: unknown[] = [];
  const names: string[] = [];
  const explicitlyProvided = new Set<string>();
  for (const column of columns) {
    if (column.is_identity === 'YES' || column.column_default?.startsWith('nextval(')) continue;
    const picked = valueForColumn(column, input);
    if (picked.found) {
      const choices = await enumValues(column, executor);
      names.push(column.column_name); explicitlyProvided.add(column.column_name); values.push(enumFallback(picked.value, choices));
    } else if (column.is_nullable === 'NO' && !column.column_default) {
      const fallback = fallbackValue(column, input);
      const choices = await enumValues(column, executor);
      names.push(column.column_name); values.push(enumFallback(fallback, choices));
    }
  }
  if (!names.length) throw new Error(`No hay columnas compatibles para guardar en ${table}.`);
  const conflictColumn = typeof upsert === 'string' ? upsert : 'id';
  const conflictExists = columns.some(c => c.column_name === conflictColumn) && names.includes(conflictColumn);
  if (upsert && conflictExists) {
    const conflictIndex = names.indexOf(conflictColumn);
    const existing = await executor.query<Record<string, unknown>>(`SELECT * FROM ${quoteIdent(table)} WHERE ${quoteIdent(conflictColumn)}=$1 LIMIT 1`, [values[conflictIndex]]);
    if (existing.rows[0]) {
      const updateNames = names.filter(n => explicitlyProvided.has(n) && n !== conflictColumn && n !== 'created_at');
      if (!updateNames.length) return existing.rows[0];
      const updateValues = updateNames.map(n => values[names.indexOf(n)]);
      updateValues.push(values[conflictIndex]);
      const setSql = updateNames.map((n,i)=>`${quoteIdent(n)}=$${i+1}`).join(',');
      const updated = await executor.query<Record<string, unknown>>(`UPDATE ${quoteIdent(table)} SET ${setSql} WHERE ${quoteIdent(conflictColumn)}=$${updateValues.length} RETURNING *`, updateValues);
      return updated.rows[0] ?? existing.rows[0];
    }
  }
  const placeholders = values.map((_, index) => `$${index+1}`);
  let sql = `INSERT INTO ${quoteIdent(table)} (${names.map(quoteIdent).join(',')}) VALUES (${placeholders.join(',')})`;
  if (upsert && conflictExists) {
    const updates = names.filter(n => explicitlyProvided.has(n) && n !== conflictColumn && n !== 'created_at').map(n => `${quoteIdent(n)}=EXCLUDED.${quoteIdent(n)}`);
    if (updates.length) sql += ` ON CONFLICT (${quoteIdent(conflictColumn)}) DO UPDATE SET ${updates.join(',')}`;
    else sql += ` ON CONFLICT (${quoteIdent(conflictColumn)}) DO NOTHING`;
  }
  sql += ' RETURNING *';
  const result = await executor.query<Record<string, unknown>>(sql, values);
  return result.rows[0] ?? {};
}
async function getByJsonField(table: string, field: string, value: string, executor: { query: Pool['query'] }): Promise<Record<string, unknown> | null> {
  if (!tableAllowlist.has(table)) throw new Error('Tabla no permitida.');
  const result = await executor.query<{ record: Record<string, unknown> }>(`SELECT to_jsonb(t) AS record FROM ${quoteIdent(table)} t WHERE lower(COALESCE(to_jsonb(t)->>$1,''))=lower($2) LIMIT 1`, [field, value]);
  return result.rows[0]?.record ?? null;
}
async function ensureReference(executor: { query: Pool['query'] }, table: 'categories'|'manufacturers', name: string): Promise<string> {
  const existing = await getByJsonField(table, 'name', name, executor);
  if (existing && typeof existing['id'] === 'string') return existing['id'];
  const id = randomUUID();
  const record: Record<string, unknown> = { id, name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g,'-'), description: 'Registro creado automáticamente para mantener el catálogo conectado.', status: 'activa', order: 999, sortOrder: 999, sort_order: 999, country: 'No especificado', website: '', active: true };
  const saved = await dynamicWrite(executor, table, record);
  return String(saved['id'] ?? id);
}
async function ensureCatalogProduct(client: { query: Pool['query'] }, b: Record<string, unknown>): Promise<string> {
  const sku = text(b['sku'],80);
  const name = text(b['name'],180);
  const rawImage = text(b['image'] ?? b['image_url'],2_000_000);
  // Large data URLs belong in the warehouse record; avoid truncation in catalog image columns.
  const catalogImage = rawImage.startsWith('data:') ? '' : rawImage.slice(0,1800);
  const catalogData = { ...b, image: catalogImage, imageUrl: catalogImage, image_url: catalogImage };
  let productId = text(b['productId'],100);
  if (productId) {
    const result = await client.query<{ id: string }>(`SELECT id FROM products WHERE id::text=$1 LIMIT 1`, [productId]);
    if (result.rows[0]) {
      await dynamicWrite(client, 'products', { ...catalogData, id: productId, code: sku, sku, name, model: name, description: text(b['description'],2000), status: 'activo', updatedAt: new Date() }, true);
      return productId;
    }
  }
  if (sku) {
    const found = await client.query<{ id: string }>(`SELECT id FROM products p WHERE to_jsonb(p)->>'sku'=$1 OR to_jsonb(p)->>'code'=$1 LIMIT 1`, [sku]);
    if (found.rows[0]) productId = found.rows[0].id;
  }
  if (productId) {
    await dynamicWrite(client, 'products', { ...catalogData, id: productId, code: sku, sku, name, model: name, description: text(b['description'],2000), status: 'activo', updatedAt: new Date() }, true);
    return productId;
  }
  const categoryId = await ensureReference(client, 'categories', 'Bodega');
  const manufacturerId = await ensureReference(client, 'manufacturers', 'Sin fabricante');
  productId = randomUUID();
  await dynamicWrite(client, 'products', {
    ...catalogData, id: productId, code: sku, sku, name, model: name, categoryId, manufacturerId,
    description: text(b['description'],2000), features: [], specifications: [], materials: [], weight: '', dimensions: '',
    standards: [], certifications: [], serviceLife: '', usage: 'Distribución / Bodega', equipmentType: 'Equipo de protección',
    warnings: [], status: 'activo', createdAt: new Date(), updatedAt: new Date(),
  });
  const image = catalogImage;
  if (image && image.length <= 1800) {
    try { await dynamicWrite(client, 'product_images', { id: randomUUID(), productId, url: image, alt: name, altText: name, isPrimary: true, sortOrder: 0, createdAt: new Date() }); }
    catch (error) { console.warn('No se pudo guardar imagen del catálogo; se conserva en bodega.', error); }
  }
  return productId;
}
async function syncWarehouseCatalogLinks(): Promise<void> {
  const client = await db().connect();
  try {
    await client.query('BEGIN');
    const result = await client.query<Record<string, unknown>>(`SELECT w.* FROM warehouse_products w
      WHERE w.active=true AND (w.product_id IS NULL OR NOT EXISTS (SELECT 1 FROM products p WHERE p.id::text=w.product_id::text))
      ORDER BY w.name, w.sku`);
    for (const row of result.rows) {
      const productId = await ensureCatalogProduct(client, { ...row, productId: row['product_id'], image: row['image_url'], costPrice: row['cost_price'], salePrice: row['sale_price'], minStock: row['min_stock'] });
      await client.query('UPDATE warehouse_products SET product_id=$2, updated_at=now() WHERE id::text=$1', [String(row['id']), productId]);
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
}

async function rowsAsJson(table: string, executor: { query: Pool['query'] }, where = '', params: unknown[] = [], order = ''): Promise<Record<string, unknown>[]> {
  if (!tableAllowlist.has(table)) throw new Error('Tabla no permitida.');
  const sql = `SELECT to_jsonb(t) AS record FROM ${quoteIdent(table)} t ${where} ${order}`;
  const result = await executor.query<{ record: Record<string, unknown> }>(sql, params);
  return result.rows.map(row => row.record);
}

async function handle(event: HandlerEvent): Promise<HandlerResponse> {
  if (event.httpMethod === 'OPTIONS') return json(204, {}, { allow: 'GET,POST,PUT,DELETE,OPTIONS' });
  const path = (event.path.split('/.netlify/functions/api')[1] || '/').replace(/\/+$/, '') || '/';
  if (path === '/health' && event.httpMethod === 'GET') {
    try { await db().query('SELECT 1'); return json(200, { ok: true, database: 'connected' }); }
    catch (error) { console.error('Health check database error', error); return json(503, { ok: false, database: 'unavailable' }); }
  }
  // Catálogo público: estas lecturas alimentan el sitio y no requieren una sesión administrativa.
  if (path === '/categories' && event.httpMethod === 'GET') {
    const q = text(event.queryStringParameters?.q, 100);
    const result = await db().query<{ record: Record<string, unknown> }>(`SELECT to_jsonb(c) AS record FROM categories c
      WHERE ($1='' OR to_jsonb(c)::text ILIKE '%' || $1 || '%')
        AND lower(COALESCE(to_jsonb(c)->>'status','activa')) IN ('activa','activo','active','true','1')
      ORDER BY COALESCE(NULLIF(to_jsonb(c)->>'sort_order','')::int, NULLIF(to_jsonb(c)->>'order','')::int, 999), to_jsonb(c)->>'name' LIMIT 500`, [q]);
    return json(200, { data: result.rows.map(row => row.record) });
  }
  if (path === '/manufacturers' && event.httpMethod === 'GET') {
    const result = await db().query<{ record: Record<string, unknown> }>(`SELECT to_jsonb(m) AS record FROM manufacturers m ORDER BY to_jsonb(m)->>'name' LIMIT 500`);
    return json(200, { data: result.rows.map(row => row.record) });
  }
  if (path === '/products' && event.httpMethod === 'GET') {
    // Solo una sesión administrativa puede ejecutar la sincronización; la lectura pública nunca escribe.
    try { const catalogSession = await getSession(event); if (catalogSession && admin(catalogSession)) await syncWarehouseCatalogLinks(); } catch (error) { console.warn('Catalog sync deferred', error); }
    const q = text(event.queryStringParameters?.q, 100);
    const result = await db().query<{ record: Record<string, unknown>; images: Record<string, unknown>[] }>(`SELECT to_jsonb(p) AS record,
      COALESCE((SELECT jsonb_agg(to_jsonb(pi)) FROM product_images pi WHERE pi.product_id::text=p.id::text), '[]'::jsonb) AS images,
      COALESCE((SELECT to_jsonb(w)->>'image_url' FROM warehouse_products w WHERE w.product_id::text=p.id::text ORDER BY w.updated_at DESC LIMIT 1), '') AS warehouse_image
      FROM products p WHERE ($1='' OR to_jsonb(p)::text ILIKE '%' || $1 || '%')
      ORDER BY to_jsonb(p)->>'name' LIMIT 1000`, [q]);
    return json(200, { data: result.rows.map(row => ({ ...row.record, images: row.images ?? [] })) });
  }

  if (path === '/auth/google' && event.httpMethod === 'POST') {
    try { return await googleLogin(event); } catch (error) { console.error('Google login failed', error); return json(500, { error: 'No se pudo completar el inicio de sesión.' }); }
  }
  if (path === '/auth/logout' && event.httpMethod === 'POST') {
    if (!sameOrigin(event)) return json(403, { error: 'Origen no permitido.' });
    const token = readCookie(event, COOKIE_NAME);
    if (token) { try { await db().query('UPDATE sessions SET revoked_at = now() WHERE token_hash = $1 AND revoked_at IS NULL', [hash(token)]); } catch (error) { console.error('Logout failed', error); } }
    return json(200, { ok: true }, { 'set-cookie': cookie('', 0) });
  }
  let user: SessionUser | null;
  try { user = await getSession(event); } catch (error) { console.error('Session lookup failed', error); return json(503, { error: 'No se pudo validar la sesión.' }); }
  if (path === '/auth/session' && event.httpMethod === 'GET') return user ? json(200, { user: { id: user.id, email: user.email, name: user.fullName, role: user.role } }) : json(401, { user: null });
  if (!user) return json(401, { error: 'Inicia sesión para continuar.' });
  if (!sameOrigin(event)) return json(403, { error: 'Origen no permitido.' });

  if (path === '/products' && event.httpMethod === 'POST') {
    if (!admin(user)) return json(403, { error: 'No tienes permiso para modificar el catálogo.' });
    const b = body(event);
    const name = text(b.name, 180); const sku = text(b.sku, 80) || text(b.code, 80);
    if (!name || !sku) return json(400, { error: 'El nombre y el código/SKU son obligatorios.' });
    const saved = await dynamicWrite(db(), 'products', { ...b, id: text(b.id,100) || randomUUID(), name, sku, code: sku, status: text(b.status,40) || 'activo', updatedAt: new Date() }, true);
    await audit(user.id, 'upsert', 'product', String(saved['id'] ?? ''), { sku, name }, event);
    return json(200, { data: saved });
  }
  const productMatch = path.match(/^\/products\/([^/]+)$/);
  if (productMatch && event.httpMethod === 'PUT') {
    if (!admin(user)) return json(403, { error: 'No tienes permiso para modificar el catálogo.' });
    const id = decodeURIComponent(productMatch[1]); const b = body(event);
    const saved = await dynamicWrite(db(), 'products', { ...b, id, updatedAt: new Date() }, true);
    await audit(user.id, 'update', 'product', id, { code: saved['code'] ?? saved['sku'] }, event);
    return json(200, { data: saved });
  }
  if (productMatch && event.httpMethod === 'DELETE') {
    if (!admin(user)) return json(403, { error: 'No tienes permiso para modificar el catálogo.' });
    const id = decodeURIComponent(productMatch[1]);
    const columns = await tableColumns('products', db());
    if (columns.some(column => column.column_name === 'status')) {
      await db().query(`UPDATE products SET status=$2 WHERE id::text=$1`, [id, 'descontinuado']);
    } else return json(400, { error: 'El catálogo no admite desactivación en el esquema actual.' });
    await audit(user.id, 'deactivate', 'product', id, { status: 'descontinuado' }, event);
    return json(200, { ok: true });
  }

  // Bodega: persistencia real de productos en PostgreSQL.
  if (path === '/warehouse-products' && event.httpMethod === 'GET') {
    if (!admin(user)) return json(403, { error: 'No tienes permiso para consultar la bodega.' });
    const result = await db().query(`SELECT id, product_id AS "productId", sku, name, description,
      image_url AS image, quantity, min_stock AS "minStock", cost_price AS "costPrice",
      sale_price AS "salePrice", location, supplier, lead_time_days AS "leadTimeDays",
      safety_stock AS "safetyStock", max_stock AS "maxStock",
      min_purchase_quantity AS "minPurchaseQuantity", purchase_multiple AS "purchaseMultiple",
      daily_demand_estimate AS "dailyDemandEstimate", demand_estimate_notes AS "demandEstimateNotes",
      currency, active, updated_at::date::text AS "updatedAt"
      FROM warehouse_products WHERE active = true ORDER BY name, sku`);
    return json(200, { data: result.rows });
  }
  if (path === '/warehouse-products' && event.httpMethod === 'POST') {
    if (!admin(user)) return json(403, { error: 'No tienes permiso para modificar la bodega.' });
    const b = body(event);
    let id = text(b.id, 100) || randomUUID();
    const sku = text(b.sku, 80);
    const name = text(b.name, 180);
    const quantity = Number(b.quantity ?? 0);
    const minStock = Number(b.minStock ?? 0);
    const costPrice = Number(b.costPrice ?? 0);
    const salePrice = Number(b.salePrice ?? 0);
    if (!id || !sku || !name || ![quantity, minStock, costPrice, salePrice].every((v) => Number.isFinite(v) && v >= 0)) {
      return json(400, { error: 'Revisa el código, nombre, existencias y precios del producto.' });
    }
    const client = await db().connect();
    let saved: Record<string, unknown> | undefined;
    try {
      await client.query('BEGIN');
      const sameSku = await client.query<{ id: string }>('SELECT id FROM warehouse_products WHERE sku = $1 LIMIT 1 FOR UPDATE', [sku]);
      if (sameSku.rows[0]) id = sameSku.rows[0].id;
      const catalogProductId = await ensureCatalogProduct(client, { ...b, sku, name });
      const previous = await client.query<{ quantity: number }>(
        'SELECT quantity FROM warehouse_products WHERE id = $1 FOR UPDATE', [id]);
      const previousQuantity = Number(previous.rows[0]?.quantity ?? 0);
      await client.query(`INSERT INTO warehouse_products
        (id, product_id, sku, name, description, image_url, quantity, min_stock, cost_price, sale_price,
         location, supplier, lead_time_days, safety_stock, max_stock, min_purchase_quantity,
         purchase_multiple, daily_demand_estimate, demand_estimate_notes, currency, active, updated_at)
        VALUES ($1, NULLIF($2,''), $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, now())
        ON CONFLICT (id) DO UPDATE SET product_id=EXCLUDED.product_id, sku=EXCLUDED.sku, name=EXCLUDED.name,
         description=EXCLUDED.description, image_url=EXCLUDED.image_url, min_stock=EXCLUDED.min_stock,
         cost_price=EXCLUDED.cost_price, sale_price=EXCLUDED.sale_price, location=EXCLUDED.location,
         supplier=EXCLUDED.supplier, lead_time_days=EXCLUDED.lead_time_days, safety_stock=EXCLUDED.safety_stock,
         max_stock=EXCLUDED.max_stock, min_purchase_quantity=EXCLUDED.min_purchase_quantity,
         purchase_multiple=EXCLUDED.purchase_multiple, daily_demand_estimate=EXCLUDED.daily_demand_estimate,
         demand_estimate_notes=EXCLUDED.demand_estimate_notes, currency=EXCLUDED.currency,
         active=EXCLUDED.active, updated_at=now()
        RETURNING id, product_id AS \"productId\", sku, name, description, image_url AS image, quantity,
         min_stock AS \"minStock\", cost_price AS \"costPrice\", sale_price AS \"salePrice\", location, supplier,
         lead_time_days AS \"leadTimeDays\", safety_stock AS \"safetyStock\", max_stock AS \"maxStock\",
         min_purchase_quantity AS \"minPurchaseQuantity\", purchase_multiple AS \"purchaseMultiple\",
         daily_demand_estimate AS \"dailyDemandEstimate\", demand_estimate_notes AS \"demandEstimateNotes\",
         currency, active, updated_at::date::text AS \"updatedAt\"`, [
          id, catalogProductId, sku, name, text(b.description,2000), text(b.image,2_000_000), quantity,
          minStock, costPrice, salePrice, text(b.location,200), text(b.supplier,200),
          Math.max(0, Number(b.leadTimeDays ?? 30)), Math.max(0, Number(b.safetyStock ?? 0)),
          b.maxStock === null || b.maxStock === undefined || b.maxStock === '' ? null : Math.max(0, Number(b.maxStock)),
          Math.max(0, Number(b.minPurchaseQuantity ?? 1)), Math.max(1, Number(b.purchaseMultiple ?? 1)),
          b.dailyDemandEstimate === null || b.dailyDemandEstimate === undefined || b.dailyDemandEstimate === '' ? null : Math.max(0, Number(b.dailyDemandEstimate)),
          text(b.demandEstimateNotes,2000), text(b.currency,3) || 'HNL', b.active !== false,
        ]);
      const delta = quantity - previousQuantity;
      if (delta !== 0) {
        await client.query(`INSERT INTO inventory_movements
          (id, warehouse_product_id, movement_type, quantity_delta, unit_cost, reference_type, reference_id, reason, created_by)
          VALUES (gen_random_uuid()::text, $1, $2, $3, $4, 'warehouse_admin', $1, $5, $6)`, [
            id, previous.rows[0] ? 'adjustment' : 'initial_balance', delta, costPrice,
            previous.rows[0] ? 'Ajuste de existencias desde administración de bodega' : 'Saldo inicial al crear producto de bodega', user.id,
          ]);
      }
      // The stock balance and its audit movement are committed together.
      if (delta !== 0) {
        await client.query('UPDATE warehouse_products SET quantity = $2, updated_at = now() WHERE id = $1', [id, quantity]);
      } else if (!previous.rows[0]) {
        await client.query('UPDATE warehouse_products SET quantity = 0 WHERE id = $1', [id]);
      }
      const finalResult = await client.query(`SELECT id, product_id AS \"productId\", sku, name, description,
        image_url AS image, quantity, min_stock AS \"minStock\", cost_price AS \"costPrice\",
        sale_price AS \"salePrice\", location, supplier, lead_time_days AS \"leadTimeDays\",
        safety_stock AS \"safetyStock\", max_stock AS \"maxStock\",
        min_purchase_quantity AS \"minPurchaseQuantity\", purchase_multiple AS \"purchaseMultiple\",
        daily_demand_estimate AS \"dailyDemandEstimate\", demand_estimate_notes AS \"demandEstimateNotes\",
        currency, active, updated_at::date::text AS \"updatedAt\" FROM warehouse_products WHERE id = $1`, [id]);
      saved = finalResult.rows[0];
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    await audit(user.id, 'upsert', 'warehouse_product', id, { sku, name, quantity }, event);
    return json(200, { data: saved });
  }
  const warehouseProductMatch = path.match(/^\/warehouse-products\/([^/]+)$/);
  if (warehouseProductMatch && event.httpMethod === 'DELETE') {
    if (!admin(user)) return json(403, { error: 'No tienes permiso para eliminar productos de bodega.' });
    const id = decodeURIComponent(warehouseProductMatch[1]);
    const result = await db().query('UPDATE warehouse_products SET active = false, updated_at = now() WHERE id = $1 AND active = true RETURNING id', [id]);
    if (!result.rows[0]) return json(404, { error: 'Producto de bodega no encontrado.' });
    await audit(user.id, 'deactivate', 'warehouse_product', id, { active: false }, event);
    return json(200, { ok: true });
  }

  if (path === '/roles' && event.httpMethod === 'GET') {
    const result = await rowsAsJson('roles', db(), '', [], "ORDER BY to_jsonb(t)->>'name'");
    return json(200, { data: result });
  }
  if (path === '/users' && event.httpMethod === 'GET') {
    const result = admin(user)
      ? await db().query<{ record: Record<string, unknown> }>(`SELECT to_jsonb(u) || jsonb_build_object('role', r.name) AS record FROM users u LEFT JOIN roles r ON r.id=u.role_id ORDER BY u.full_name LIMIT 1000`)
      : await db().query<{ record: Record<string, unknown> }>(`SELECT jsonb_build_object('id',u.id,'full_name',u.full_name,'role',r.name,'status',u.status,'created_at',u.created_at,'last_access_at',u.last_access_at) AS record FROM users u LEFT JOIN roles r ON r.id=u.role_id ORDER BY u.full_name LIMIT 1000`);
    return json(200, { data: result.rows.map(row => row.record) });
  }
  if (path === '/inspections' && event.httpMethod === 'GET') {
    const q = text(event.queryStringParameters?.equipmentId, 100);
    const result = await db().query<{ record: Record<string, unknown> }>(`SELECT to_jsonb(i) AS record FROM inspections i
      WHERE ($1='' OR to_jsonb(i)->>'equipment_id'=$1 OR to_jsonb(i)->>'equipmentId'=$1)
      ORDER BY COALESCE(to_jsonb(i)->>'inspection_date', to_jsonb(i)->>'date', to_jsonb(i)->>'created_at') DESC LIMIT 2000`, [q]);
    return json(200, { data: result.rows.map(row => row.record) });
  }
  if (path === '/inspections' && event.httpMethod === 'POST') {
    const b = body(event);
    const equipmentId = text(b.equipmentId,100);
    if (!equipmentId) return json(400, { error: 'Debes seleccionar un equipo.' });
    const saved = await dynamicWrite(db(), 'inspections', { ...b, id: text(b.id,100) || randomUUID(), equipmentId, inspectorId: text(b.inspectorId,100) || user.id, inspectionDate: text(b.date,10) || new Date().toISOString().slice(0,10), date: text(b.date,10) || new Date().toISOString().slice(0,10), createdAt: new Date() });
    await dynamicWrite(db(), 'equipment_history', { id: randomUUID(), equipmentId, actorUserId: user.id, eventType: 'inspeccion', type: 'inspeccion', title: 'Inspección registrada', detail: text(b.observations,1000), createdAt: new Date(), date: text(b.date,10) || new Date().toISOString().slice(0,10) });
    await audit(user.id, 'create', 'inspection', String(saved['id'] ?? ''), { equipmentId, result: b.result }, event);
    return json(201, { data: saved });
  }
  if (path === '/documents' && event.httpMethod === 'GET') {
    const productId = text(event.queryStringParameters?.productId,100);
    const equipmentId = text(event.queryStringParameters?.equipmentId,100);
    const result = await db().query<{ record: Record<string, unknown> }>(`SELECT to_jsonb(d) AS record FROM technical_documents d
      WHERE ($1='' OR to_jsonb(d)->>'product_id'=$1 OR to_jsonb(d)->>'productId'=$1)
        AND ($2='' OR to_jsonb(d)->>'equipment_id'=$2 OR to_jsonb(d)->>'equipmentId'=$2)
      ORDER BY COALESCE(to_jsonb(d)->>'updated_at',to_jsonb(d)->>'created_at') DESC LIMIT 2000`, [productId,equipmentId]);
    return json(200, { data: result.rows.map(row => row.record) });
  }
  if (path === '/equipment/history' && event.httpMethod === 'GET') {
    const equipmentId = text(event.queryStringParameters?.equipmentId,100);
    if (!equipmentId) return json(400, { error: 'Falta equipmentId.' });
    const result = await db().query<{ record: Record<string, unknown> }>(`SELECT to_jsonb(h) AS record FROM equipment_history h WHERE to_jsonb(h)->>'equipment_id'=$1 OR to_jsonb(h)->>'equipmentId'=$1 ORDER BY COALESCE(to_jsonb(h)->>'event_date',to_jsonb(h)->>'created_at') DESC LIMIT 500`, [equipmentId]);
    return json(200, { data: result.rows.map(row => row.record) });
  }
  if (path === '/settings/quote-company' && event.httpMethod === 'GET') {
    const found = await getByJsonField('app_settings','key','quote_company',db());
    const value = found?.['value'] ?? found?.['value_json'] ?? found?.['setting_value'] ?? found?.['json_value'];
    if (value && typeof value === 'object') return json(200, { data: value });
    if (typeof value === 'string') { try { return json(200, { data: JSON.parse(value) }); } catch { /* return default below */ } }
    return json(200, { data: { name: 'Vertical Safety', address: '', phone: '', email: '', logoDataUrl: '/vertical-safety-logo.png' } });
  }
  if (path === '/settings/quote-company' && event.httpMethod === 'PUT') {
    if (!admin(user)) return json(403, { error: 'No tienes permiso para modificar la configuración.' });
    const b = body(event); const profile = b.profile && typeof b.profile === 'object' ? b.profile as Record<string,unknown> : b;
    const saved = await dynamicWrite(db(), 'app_settings', { key: 'quote_company', value: profile, valueJson: profile, settingValue: profile, jsonValue: profile, updatedBy: user.id, updatedAt: new Date() }, 'key');
    await audit(user.id, 'update', 'app_settings', 'quote_company', {}, event);
    return json(200, { data: saved['value'] ?? saved['value_json'] ?? saved['setting_value'] ?? profile });
  }
  if (path === '/quotes' && event.httpMethod === 'POST') {
    if (!admin(user)) return json(403, { error: 'No tienes permiso para guardar cotizaciones.' });
    const b = body(event); const customer = b.customer && typeof b.customer === 'object' ? b.customer as Record<string,unknown> : {};
    const rawItems = Array.isArray(b.items) ? b.items as Record<string,unknown>[] : [];
    if (!rawItems.length) return json(400, { error: 'Agrega al menos un producto a la cotización.' });
    const client = await db().connect();
    try {
      await client.query('BEGIN');
      const quoteId = randomUUID(); const now = new Date(); const quoteNumber = `COT-${now.toISOString().slice(0,10).replace(/-/g,'')}-${now.getTime().toString().slice(-6)}`;
      const lines: Record<string,unknown>[] = []; let subtotal = 0;
      for (const item of rawItems) {
        const productId = text(item.warehouseProductId,100); const quantity = Math.floor(Number(item.quantity));
        if (!productId || !Number.isFinite(quantity) || quantity < 1) throw new Error('Cantidad inválida en la cotización.');
        const found = await client.query<Record<string,unknown>>('SELECT * FROM warehouse_products WHERE id::text=$1 AND active=true',[productId]);
        const product = found.rows[0]; if (!product) throw new Error('Uno de los productos de la cotización no está disponible.');
        const unitPrice = Number(item.unitPrice ?? product['sale_price']); if (!Number.isFinite(unitPrice) || unitPrice < 0) throw new Error('Precio inválido en la cotización.');
        const lineTotal = Number((quantity*unitPrice).toFixed(2)); subtotal += lineTotal;
        lines.push({ id:randomUUID(), quoteId, warehouseProductId:productId, quantity, unitPrice, lineTotal, sku:product['sku'], name:product['name'] });
      }
      const quote = await dynamicWrite(client,'quotes',{ id:quoteId, quoteNumber, companyName:text(customer['companyName'],180), customerName:text(customer['companyName'],180), contactName:text(customer['contactName'],180), customerContact:text(customer['contactName'],180), place:text(customer['place'],180), date:text(customer['date'],10) || now.toISOString().slice(0,10), notes:text(customer['notes'],2000), subtotal, total:Number(subtotal.toFixed(2)), status:'draft', createdBy:user.id, createdAt:now });
      for (const line of lines) await dynamicWrite(client,'quote_lines',line);
      await client.query('COMMIT');
      await audit(user.id,'create','quote',quoteId,{quoteNumber,total:subtotal},event);
      return json(201,{data:{...quote,lines}});
    } catch(error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  }
  if (path === '/sales' && event.httpMethod === 'GET') {
    if (!admin(user)) return json(403, { error: 'No tienes permiso para consultar ventas.' });
    const result = await db().query<{ record: Record<string, unknown>; lines: Record<string, unknown>[] }>(`SELECT to_jsonb(s) AS record,
      COALESCE((SELECT jsonb_agg(to_jsonb(sl)) FROM sale_lines sl WHERE to_jsonb(sl)->>'sale_id'=s.id::text), '[]'::jsonb) AS lines
      FROM sales s ORDER BY COALESCE(to_jsonb(s)->>'sold_at',to_jsonb(s)->>'created_at') DESC LIMIT 2000`);
    return json(200, { data: result.rows.map(row => ({ ...row.record, lines: row.lines ?? [] })) });
  }
  if (path === '/sales' && event.httpMethod === 'POST') {
    if (!admin(user)) return json(403, { error: 'No tienes permiso para registrar ventas.' });
    const b = body(event); const rawLines = Array.isArray(b.lines) ? b.lines as Record<string,unknown>[] : [];
    if (!rawLines.length) return json(400, { error: 'Agrega al menos un producto a la venta.' });
    const client = await db().connect();
    try {
      await client.query('BEGIN');
      const saleId = randomUUID(); const now = new Date();
      const datePart = now.toISOString().slice(0,10).replace(/-/g,''); const saleNumber = `VS-${datePart}-${now.getTime().toString().slice(-6)}`;
      const normalized = new Map<string,number>();
      for (const line of rawLines) { const productId = text(line.warehouseProductId,100); const qty = Math.floor(Number(line.quantity)); if (!productId || !Number.isFinite(qty) || qty < 1) throw new Error('Cantidad de venta inválida.'); normalized.set(productId,(normalized.get(productId) ?? 0)+qty); }
      const lines: Record<string,unknown>[] = []; let subtotal = 0;
      for (const [warehouseProductId, quantity] of normalized) {
        const result = await client.query<Record<string,unknown>>('SELECT * FROM warehouse_products WHERE id::text=$1 AND active=true FOR UPDATE',[warehouseProductId]);
        const product = result.rows[0]; if (!product) throw new Error('Uno de los productos no está disponible.');
        const stock = Number(product['quantity']); if (stock < quantity) throw new Error(`Existencias insuficientes para ${String(product['name'])}.`);
        const unitPrice = Number(product['sale_price']); const unitCost = Number(product['cost_price']); const lineTotal = Number((unitPrice*quantity).toFixed(2)); subtotal += lineTotal;
        lines.push({ id: randomUUID(), saleId, warehouseProductId, sku: product['sku'], name: product['name'], quantity, unitPrice, unitCost, lineTotal });
        await client.query('UPDATE warehouse_products SET quantity=$2, updated_at=now() WHERE id::text=$1',[warehouseProductId,stock-quantity]);
        await dynamicWrite(client,'inventory_movements',{ id: randomUUID(), warehouseProductId, movementType: 'sale', quantityDelta: -quantity, unitCost, referenceType: 'sale', referenceId: saleId, reason: `Venta ${saleNumber}`, createdBy: user.id, createdAt: now });
      }
      const discount = Number(b.discount ?? 0); if (!Number.isFinite(discount) || discount < 0 || discount > subtotal) throw new Error('Descuento inválido.');
      const sale = await dynamicWrite(client,'sales',{ id: saleId, saleNumber, soldAt: now, customerName: text(b.customerName,180), customerContact: text(b.customerContact,180), paymentMethod: text(b.paymentMethod,40) || 'efectivo', notes: text(b.notes,2000), subtotal, discount, total: Number((subtotal-discount).toFixed(2)), status: 'completed', createdBy: user.id, createdAt: now });
      for (const line of lines) await dynamicWrite(client,'sale_lines',line);
      await client.query('COMMIT');
      await audit(user.id,'create','sale',saleId,{saleNumber,total:Number((subtotal-discount).toFixed(2))},event);
      return json(201,{data:{...sale,lines}});
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  }
  const reportExportMatch = path.match(/^\/reports\/([^/]+)\/export$/);
  if (reportExportMatch && event.httpMethod === 'GET') {
    if (!admin(user)) return json(403, { error: 'No tienes permiso para exportar reportes.' });
    const reportId = decodeURIComponent(reportExportMatch[1]);
    const reportTables: Record<string,string> = { catalogo: 'products', equipos: 'equipment', inspecciones: 'inspections', bodega: 'warehouse_products', ventas: 'sales' };
    const table = reportTables[reportId];
    if (!table) return json(404, { error: 'Reporte no encontrado.' });
    const rows = await rowsAsJson(table, db(), '', [], "ORDER BY COALESCE(to_jsonb(t)->>'updated_at',to_jsonb(t)->>'created_at',to_jsonb(t)->>'sold_at') DESC");
    const safeRows = rows.map(row => Object.fromEntries(Object.entries(row).filter(([key]) => !['image','image_url','logo_data_url','token_hash'].includes(key))));
    return json(200, { data: { reportId, rows: safeRows } });
  }
  if (path === '/reports' && event.httpMethod === 'GET') {
    if (!admin(user)) return json(403, { error: 'No tienes permiso para consultar reportes.' });
    const [products,equipment,inspections,warehouse,sales] = await Promise.all([
      db().query('SELECT count(*)::int AS count FROM products'), db().query('SELECT count(*)::int AS count FROM equipment'),
      db().query('SELECT count(*)::int AS count FROM inspections'), db().query('SELECT count(*)::int AS count FROM warehouse_products WHERE active=true'),
      db().query('SELECT count(*)::int AS count FROM sales'),
    ]);
    const now = new Date().toISOString();
    return json(200,{data:[
      {id:'catalogo',name:'Catálogo de productos',description:'Productos registrados en PostgreSQL.',rows:products.rows[0]?.count ?? 0,updatedAt:now},
      {id:'equipos',name:'Inventario de equipos',description:'Unidades de equipo registradas.',rows:equipment.rows[0]?.count ?? 0,updatedAt:now},
      {id:'inspecciones',name:'Inspecciones',description:'Historial de inspecciones registradas.',rows:inspections.rows[0]?.count ?? 0,updatedAt:now},
      {id:'bodega',name:'Existencias de bodega',description:'Productos activos de bodega.',rows:warehouse.rows[0]?.count ?? 0,updatedAt:now},
      {id:'ventas',name:'Ventas',description:'Ventas registradas en PostgreSQL.',rows:sales.rows[0]?.count ?? 0,updatedAt:now},
    ]});
  }

  if (path === '/equipment' && event.httpMethod === 'GET') {
    const q = text(event.queryStringParameters?.q, 100);
    const result = await db().query(`SELECT id, internal_code, serial_number, product_id, status, manufacturing_date, purchase_date, commissioning_date, location, assigned_user_id, last_inspection_date, next_inspection_date, service_life, notes, qr_code, data_matrix_code, created_at, updated_at
      FROM equipment WHERE ($1 = '' OR internal_code ILIKE '%' || $1 || '%' OR serial_number ILIKE '%' || $1 || '%' OR COALESCE(data_matrix_code, '') ILIKE '%' || $1 || '%') ORDER BY created_at DESC LIMIT 1000`, [q]);
    return json(200, { data: result.rows });
  }
  if (path === '/equipment' && event.httpMethod === 'POST') {
    if (!admin(user)) return json(403, { error: 'No tienes permiso para registrar equipos.' });
    const b = body(event); const id = text(b.id, 100); const internalCode = text(b.internalCode, 100); const serialNumber = text(b.serialNumber, 200); const productId = text(b.productId, 100); const status = text(b.status, 40);
    const allowed = ['activo','disponible','asignado','en_inspeccion','mantenimiento','proximo_vencer','vencido','fuera_servicio','retirado'];
    if (!id || !internalCode || !serialNumber || !productId || !allowed.includes(status)) return json(400, { error: 'Datos del equipo incompletos o inválidos.' });
    const result = await db().query(`INSERT INTO equipment (id, internal_code, serial_number, product_id, status, manufacturing_date, purchase_date, commissioning_date, location, service_life, notes, qr_code, data_matrix_code)
      VALUES ($1,$2,$3,$4,$5,NULLIF($6,'')::date,NULLIF($7,'')::date,NULLIF($8,'')::date,$9,$10,$11,$12,NULLIF($13,''))
      RETURNING id, internal_code, serial_number, product_id, status, location, qr_code, data_matrix_code, created_at, updated_at`, [id, internalCode, serialNumber, productId, status, text(b.manufacturingDate,10), text(b.purchaseDate,10), text(b.commissioningDate,10), text(b.location,200), text(b.serviceLife,100), text(b.notes,2000), text(b.qrCode,500) || `EQUIPMENT:${internalCode}`, text(b.dataMatrixCode,200)]);
    await audit(user.id, 'create', 'equipment', id, { internalCode }, event);
    return json(201, { data: result.rows[0] });
  }
  const equipmentMatch = path.match(/^\/equipment\/([^/]+)$/);
  if (equipmentMatch && event.httpMethod === 'PUT') {
    if (!admin(user)) return json(403, { error: 'No tienes permiso para modificar equipos.' });
    const id = decodeURIComponent(equipmentMatch[1]); const b = body(event);
    const status = text(b.status, 40);
    const allowed = ['activo','disponible','asignado','en_inspeccion','mantenimiento','proximo_vencer','vencido','fuera_servicio','retirado'];
    if (!text(b.internalCode,100) || !text(b.serialNumber,200) || !text(b.productId,100) || !allowed.includes(status)) return json(400, { error: 'Datos del equipo incompletos o inválidos.' });
    const result = await db().query(`UPDATE equipment SET internal_code=$2, serial_number=$3, product_id=$4, status=$5, manufacturing_date=NULLIF($6,'')::date, purchase_date=NULLIF($7,'')::date, commissioning_date=NULLIF($8,'')::date, location=$9, assigned_user_id=NULLIF($10,''), last_inspection_date=NULLIF($11,'')::date, next_inspection_date=NULLIF($12,'')::date, service_life=$13, notes=$14, qr_code=$15, data_matrix_code=NULLIF($16,''), updated_at=now() WHERE id=$1 RETURNING id, internal_code, serial_number, product_id, status, manufacturing_date, purchase_date, commissioning_date, location, assigned_user_id, last_inspection_date, next_inspection_date, service_life, notes, qr_code, data_matrix_code, created_at, updated_at`, [id, text(b.internalCode,100), text(b.serialNumber,200), text(b.productId,100), status, text(b.manufacturingDate,10), text(b.purchaseDate,10), text(b.commissioningDate,10), text(b.location,200), text(b.assignedUserId,100), text(b.lastInspectionDate,10), text(b.nextInspectionDate,10), text(b.serviceLife,100), text(b.notes,2000), text(b.qrCode,500), text(b.dataMatrixCode,200)]);
    if (!result.rows[0]) return json(404, { error: 'Equipo no encontrado.' });
    await audit(user.id, 'update', 'equipment', id, { internalCode: text(b.internalCode,100) }, event);
    return json(200, { data: result.rows[0] });
  }
  if (equipmentMatch && event.httpMethod === 'DELETE') {
    if (!admin(user)) return json(403, { error: 'No tienes permiso para retirar equipos.' });
    const id = decodeURIComponent(equipmentMatch[1]);
    // Equipment history/inspection foreign keys intentionally restrict hard deletion; use status=retirado instead.
    const result = await db().query(`UPDATE equipment SET status='retirado', updated_at=now() WHERE id=$1 RETURNING id`, [id]);
    if (!result.rows[0]) return json(404, { error: 'Equipo no encontrado.' });
    await audit(user.id, 'retire', 'equipment', id, { status: 'retirado' }, event);
    return json(200, { ok: true });
  }
  if (path === '/admin/bootstrap' && event.httpMethod === 'GET') return json(200, { ready: true, role: user.role, database: 'connected' });
  return json(404, { error: 'Endpoint no encontrado.' });
}

export const handler: Handler = async (event) => {
  try { return await handle(event); }
  catch (error) {
    console.error('API request failed', error);
    const message = error instanceof Error ? error.message : '';
    if (message.includes('duplicate key')) return json(409, { error: 'Ya existe un registro con esos datos.' });
    if (message.toLowerCase().includes('foreign key')) return json(400, { error: 'La referencia indicada no existe. Revisa categoría, fabricante y producto relacionado.' });
    if (message.includes('Existencias insuficientes') || message.includes('Cantidad de venta inválida') || message.includes('Descuento inválido') || message.includes('Cantidad inválida en la cotización') || message.includes('Precio inválido en la cotización') || message.includes('no está disponible')) return json(400, { error: message });
    if (message.includes('duplicate key')) return json(409, { error: 'Ya existe un registro con esos datos.' });
    return json(500, { error: 'Error interno del servidor.' });
  }
};
