import { Hono, type MiddlewareHandler } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import type { AppEnv } from './env';
import {
  changePasswordSchema,
  forgotSchema,
  handleChangeSchema,
  handleSchema,
  loginSchema,
  registerSchema,
  resetSchema
} from '../shared/schemas';
import { hashProof, hashToken, randomToken, verifyProof } from '../shared/auth';
import {
  audit,
  clientIp,
  jsonError,
  parseBody,
  rateLimit,
  tooMany,
  userAgent
} from './util';
import { getUserById, toPrivate, USER_COLUMNS, type UserRow } from './users';
import {
  adminNewMemberEmail,
  dispatchEmail,
  EMAIL_SUBJECTS,
  queueEmail,
  resetEmail,
  welcomeEmail
} from './email';

export const SESSION_COOKIE = 'ksd_session';
const SESSION_DAYS = 30;

function sessionCookieOptions(env: AppEnv['Bindings']) {
  return {
    httpOnly: true,
    secure: env.APP_URL.startsWith('https://'),
    sameSite: 'Lax' as const,
    path: '/',
    maxAge: SESSION_DAYS * 86400
  };
}

export async function createSession(c: Parameters<MiddlewareHandler<AppEnv>>[0], userId: number): Promise<void> {
  const env = c.env;
  const raw = randomToken(32);
  const id = await hashToken(raw);
  const expires = new Date(Date.now() + SESSION_DAYS * 86400 * 1000).toISOString();
  await env.DB.prepare('INSERT INTO sessions (id, user_id, expires_at, ip, user_agent) VALUES (?, ?, ?, ?, ?)')
    .bind(id, userId, expires, clientIp(c), userAgent(c))
    .run();
  await env.DB.prepare(
    'DELETE FROM sessions WHERE id IN (SELECT id FROM sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT -1 OFFSET 10)'
  )
    .bind(userId)
    .run();
  setCookie(c, SESSION_COOKIE, raw, sessionCookieOptions(env));
}

export async function destroySession(c: Parameters<MiddlewareHandler<AppEnv>>[0]): Promise<void> {
  const raw = getCookie(c, SESSION_COOKIE);
  if (raw) {
    const id = await hashToken(raw);
    await c.env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(id).run();
  }
  deleteCookie(c, SESSION_COOKIE, { path: '/' });
}

export const loadSession: MiddlewareHandler<AppEnv> = async (c, next) => {
  const raw = getCookie(c, SESSION_COOKIE);
  if (raw && raw.length <= 100) {
    const id = await hashToken(raw);
    const row = await c.env.DB.prepare(
      `SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = ? AND s.expires_at > ?`
    )
      .bind(id, new Date().toISOString())
      .first<UserRow>();
    if (row) {
      c.set('user', row);
      c.set('sessionId', id);
    } else {
      deleteCookie(c, SESSION_COOKIE, { path: '/' });
    }
  }
  await next();
};

export const requireAuth: MiddlewareHandler<AppEnv> = async (c, next) => {
  if (!c.get('user')) return jsonError(c, 401, 'unauthorized', 'Please sign in');
  await next();
};

export const requireAdmin: MiddlewareHandler<AppEnv> = async (c, next) => {
  const user = c.get('user');
  if (!user) return jsonError(c, 401, 'unauthorized', 'Please sign in');
  if (user.role !== 'admin') return jsonError(c, 403, 'forbidden', 'Admin access required');
  await next();
};

export const authRoutes = new Hono<AppEnv>();

authRoutes.get('/handle', async (c) => {
  const ip = c.get('ip');
  const rl = await rateLimit(c.env, `handle:${ip}`, 80, 60);
  if (!rl.ok) return tooMany(c, rl.retryAfter);
  const value = (c.req.query('value') || '').trim().toLowerCase();
  const parsed = handleSchema.safeParse(value);
  if (!parsed.success) {
    return c.json({ available: false, reason: parsed.error.issues[0]?.message || 'handle_format' });
  }
  const exists = await c.env.DB.prepare('SELECT id FROM users WHERE handle = ? COLLATE NOCASE').bind(value).first();
  return c.json({ available: !exists, reason: exists ? 'handle_taken' : '' });
});

authRoutes.post('/register', async (c) => {
  const ip = c.get('ip');
  const rl = await rateLimit(c.env, `register:${ip}`, 6, 3600);
  if (!rl.ok) return tooMany(c, rl.retryAfter);

  const settings = await c.env.DB.prepare("SELECT value FROM settings WHERE key = 'registration_open'").first<{ value: string }>();
  if (settings?.value === 'false') return jsonError(c, 403, 'registration_closed', 'Registration is currently closed');

  const parsed = await parseBody(c, registerSchema);
  if (parsed.response) return parsed.response;
  const data = parsed.data!;

  const [emailTaken, handleTaken] = await Promise.all([
    c.env.DB.prepare('SELECT id FROM users WHERE email = ? COLLATE NOCASE').bind(data.email).first(),
    c.env.DB.prepare('SELECT id FROM users WHERE handle = ? COLLATE NOCASE').bind(data.handle).first()
  ]);
  if (emailTaken) return jsonError(c, 409, 'email_taken', 'Email already registered', { email: 'email_taken' });
  if (handleTaken) return jsonError(c, 409, 'handle_taken', 'Handle already taken', { handle: 'handle_taken' });

  const passwordHash = await hashProof(data.proof, c.env.PASSWORD_PEPPER);
  let id: number;
  try {
    const result = await c.env.DB.prepare(
      `INSERT INTO users (email, password_hash, handle, full_name_ar, status, role, consent)
       VALUES (?, ?, ?, ?, 'pending', 'member', ?)`
    )
      .bind(data.email, passwordHash, data.handle, data.fullNameAr, JSON.stringify({ locale: data.locale, at: new Date().toISOString() }))
      .run();
    id = Number(result.meta.last_row_id);
  } catch (err) {
    const msg = String(err).toLowerCase();
    if (msg.includes('unique')) {
      return jsonError(c, 409, 'duplicate', 'Email or handle already exists', { handle: 'handle_taken' });
    }
    throw err;
  }

  const user = await getUserById(c.env, id);
  if (!user) return jsonError(c, 500, 'server_error', 'Could not create account');

  await createSession(c, id);
  const welcome = await queueEmail(c.env, {
    to: data.email,
    template: 'welcome',
    subject: EMAIL_SUBJECTS.welcome,
    html: welcomeEmail(data.fullNameAr, data.handle, c.env.APP_URL)
  });
  if (welcome) c.executionCtx.waitUntil(dispatchEmail(c.env, welcome));
  const settingsRow = await c.env.DB.prepare("SELECT value FROM settings WHERE key = 'admin_notify'").first<{ value: string }>();
  if (settingsRow?.value !== 'false') {
    const adminMail = await queueEmail(c.env, {
      to: c.env.ADMIN_EMAIL,
      template: 'admin_new_member',
      subject: EMAIL_SUBJECTS.adminNew,
      html: adminNewMemberEmail(data.fullNameAr, data.email, data.handle, c.env.APP_URL)
    });
    if (adminMail) c.executionCtx.waitUntil(dispatchEmail(c.env, adminMail));
  }
  await audit(c.env, id, 'register', 'user', String(id), { handle: data.handle });
  return c.json({ user: toPrivate(user) }, 201);
});

authRoutes.post('/login', async (c) => {
  const ip = c.get('ip');
  const rl = await rateLimit(c.env, `login:${ip}`, 15, 900);
  if (!rl.ok) return tooMany(c, rl.retryAfter);
  const parsed = await parseBody(c, loginSchema);
  if (parsed.response) return parsed.response;
  const { email, proof } = parsed.data!;

  const rlEmail = await rateLimit(c.env, `login-email:${email}`, 10, 900);
  if (!rlEmail.ok) return tooMany(c, rlEmail.retryAfter);

  const user = await c.env.DB.prepare(`SELECT ${USER_COLUMNS} FROM users WHERE email = ? COLLATE NOCASE`)
    .bind(email)
    .first<UserRow>();
  const valid = user ? await verifyProof(proof, user.password_hash, c.env.PASSWORD_PEPPER) : false;
  if (!user || !valid) {
    await audit(c.env, user?.id ?? null, 'login_failed', 'user', user ? String(user.id) : email);
    return jsonError(c, 401, 'invalid_credentials', 'Invalid email or password');
  }

  await c.env.DB.prepare('UPDATE users SET last_login_at = ?, updated_at = ? WHERE id = ?')
    .bind(new Date().toISOString(), new Date().toISOString(), user.id)
    .run();
  await createSession(c, user.id);
  await audit(c.env, user.id, 'login', 'user', String(user.id));
  const fresh = await getUserById(c.env, user.id);
  return c.json({ user: toPrivate(fresh || user) });
});

authRoutes.post('/logout', async (c) => {
  const user = c.get('user');
  await destroySession(c);
  if (user) await audit(c.env, user.id, 'logout', 'user', String(user.id));
  return c.json({ ok: true });
});

authRoutes.get('/me', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ user: null });
  return c.json({ user: toPrivate(user) });
});

authRoutes.post('/forgot', async (c) => {
  const ip = c.get('ip');
  const rl = await rateLimit(c.env, `forgot:${ip}`, 5, 900);
  if (!rl.ok) return tooMany(c, rl.retryAfter);
  const parsed = await parseBody(c, forgotSchema);
  if (parsed.response) return parsed.response;
  const { email } = parsed.data!;
  const user = await c.env.DB.prepare(`SELECT ${USER_COLUMNS} FROM users WHERE email = ? COLLATE NOCASE`)
    .bind(email)
    .first<UserRow>();
  if (user) {
    await c.env.DB.prepare('DELETE FROM password_resets WHERE user_id = ? OR expires_at < ?')
      .bind(user.id, new Date().toISOString())
      .run();
    const raw = randomToken(32);
    const id = await hashToken(raw);
    const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    await c.env.DB.prepare('INSERT INTO password_resets (id, user_id, expires_at) VALUES (?, ?, ?)')
      .bind(id, user.id, expires)
      .run();
    const link = `${c.env.APP_URL}/reset?token=${encodeURIComponent(raw)}&email=${encodeURIComponent(email)}`;
    const mailId = await queueEmail(c.env, {
      to: email,
      template: 'reset',
      subject: EMAIL_SUBJECTS.reset,
      html: resetEmail(user.full_name_ar, link)
    });
    if (mailId) c.executionCtx.waitUntil(dispatchEmail(c.env, mailId));
    await audit(c.env, user.id, 'password_reset_requested', 'user', String(user.id));
  }
  return c.json({ ok: true });
});

authRoutes.post('/reset', async (c) => {
  const ip = c.get('ip');
  const rl = await rateLimit(c.env, `reset:${ip}`, 8, 900);
  if (!rl.ok) return tooMany(c, rl.retryAfter);
  const parsed = await parseBody(c, resetSchema);
  if (parsed.response) return parsed.response;
  const { token, email, proof } = parsed.data!;
  const id = await hashToken(token);
  const reset = await c.env.DB.prepare(
    `SELECT r.id, r.user_id, u.email, u.full_name_ar FROM password_resets r
     JOIN users u ON u.id = r.user_id
     WHERE r.id = ? AND r.used = 0 AND r.expires_at > ? AND u.email = ? COLLATE NOCASE`
  )
    .bind(id, new Date().toISOString(), email)
    .first<{ id: string; user_id: number; email: string; full_name_ar: string }>();
  if (!reset) return jsonError(c, 400, 'invalid_token', 'This reset link is invalid or expired');

  const hash = await hashProof(proof, c.env.PASSWORD_PEPPER);
  await c.env.DB.batch([
    c.env.DB.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?').bind(hash, new Date().toISOString(), reset.user_id),
    c.env.DB.prepare('UPDATE password_resets SET used = 1 WHERE id = ?').bind(reset.id),
    c.env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(reset.user_id)
  ]);
  await createSession(c, reset.user_id);
  await audit(c.env, reset.user_id, 'password_reset_completed', 'user', String(reset.user_id));
  const user = await getUserById(c.env, reset.user_id);
  return c.json({ user: user ? toPrivate(user) : null });
});

authRoutes.post('/change-password', requireAuth, async (c) => {
  const user = c.get('user')!;
  const parsed = await parseBody(c, changePasswordSchema);
  if (parsed.response) return parsed.response;
  const { currentProof, newProof } = parsed.data!;
  const valid = await verifyProof(currentProof, user.password_hash, c.env.PASSWORD_PEPPER);
  if (!valid) return jsonError(c, 400, 'invalid_password', 'Current password is incorrect', { currentPassword: 'invalid_password' });
  const hash = await hashProof(newProof, c.env.PASSWORD_PEPPER);
  await c.env.DB.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?')
    .bind(hash, new Date().toISOString(), user.id)
    .run();
  const sessionId = c.get('sessionId');
  if (sessionId) {
    await c.env.DB.prepare('DELETE FROM sessions WHERE user_id = ? AND id != ?').bind(user.id, sessionId).run();
  }
  await audit(c.env, user.id, 'password_changed', 'user', String(user.id));
  return c.json({ ok: true });
});

authRoutes.patch('/handle', requireAuth, async (c) => {
  const user = c.get('user')!;
  const rl = await rateLimit(c.env, `handle-change:${user.id}`, 5, 3600);
  if (!rl.ok) return tooMany(c, rl.retryAfter);
  const parsed = await parseBody(c, handleChangeSchema);
  if (parsed.response) return parsed.response;
  const { handle } = parsed.data!;
  if (handle === user.handle) return c.json({ user: toPrivate(user) });
  const exists = await c.env.DB.prepare('SELECT id FROM users WHERE handle = ? COLLATE NOCASE AND id != ?')
    .bind(handle, user.id)
    .first();
  if (exists) return jsonError(c, 409, 'handle_taken', 'Handle already taken', { handle: 'handle_taken' });
  await c.env.DB.prepare('UPDATE users SET handle = ?, updated_at = ? WHERE id = ?')
    .bind(handle, new Date().toISOString(), user.id)
    .run();
  await audit(c.env, user.id, 'handle_changed', 'user', String(user.id), { from: user.handle, to: handle });
  const fresh = await getUserById(c.env, user.id);
  return c.json({ user: fresh ? toPrivate(fresh) : null });
});
