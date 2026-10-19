import type { Handler, HandlerEvent, HandlerResponse } from '@netlify/functions';
import { Pool } from 'pg';
import { createHash, randomBytes } from 'node:crypto';

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

async function handle(event: HandlerEvent): Promise<HandlerResponse> {
  if (event.httpMethod === 'OPTIONS') return json(204, {}, { allow: 'GET,POST,PUT,DELETE,OPTIONS' });
  const path = (event.path.split('/.netlify/functions/api')[1] || '/').replace(/\/+$/, '') || '/';
  if (path === '/health' && event.httpMethod === 'GET') {
    try { await db().query('SELECT 1'); return json(200, { ok: true, database: 'connected' }); }
    catch (error) { console.error('Health check database error', error); return json(503, { ok: false, database: 'unavailable' }); }
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

  if (path === '/categories' && event.httpMethod === 'GET') {
    const result = await db().query('SELECT id, name, slug, description, image_url, status, sort_order FROM categories WHERE status = $1 ORDER BY sort_order, name', ['activa']);
    return json(200, { data: result.rows });
  }
  if (path === '/products' && event.httpMethod === 'GET') {
    const q = text(event.queryStringParameters?.q, 100);
    const result = await db().query(`SELECT p.*, COALESCE(jsonb_agg(jsonb_build_object('id', pi.id, 'url', pi.url, 'alt', pi.alt, 'isPrimary', pi.is_primary)) FILTER (WHERE pi.id IS NOT NULL), '[]'::jsonb) AS images
      FROM products p LEFT JOIN product_images pi ON pi.product_id = p.id
      WHERE ($1 = '' OR p.name ILIKE '%' || $1 || '%' OR p.code ILIKE '%' || $1 || '%' OR p.sku ILIKE '%' || $1 || '%')
      GROUP BY p.id ORDER BY p.name LIMIT 500`, [q]);
    return json(200, { data: result.rows });
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
    if (message.includes('foreign key')) return json(400, { error: 'La referencia indicada no existe.' });
    return json(500, { error: 'Error interno del servidor.' });
  }
};
