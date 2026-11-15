import { Hono, type Context } from 'hono';
import type { AppEnv } from './env';
import { requireAdmin } from './auth';
import { adminRejectSchema, adminSettingsSchema } from '../shared/schemas';
import {
  audit,
  escapeLike,
  getSettings,
  jsonError,
  parseBody,
  rateLimit,
  setSetting,
  tooMany
} from './util';
import { getUserById, toAdminMember, toPrivate, USER_COLUMNS, type UserRow } from './users';
import {
  approvedEmail,
  dispatchEmail,
  EMAIL_SUBJECTS,
  rejectedEmail,
  sendOrQueue,
  suspendedEmail,
  testEmail
} from './email';
import type { AdminStats } from '../shared/types';

export const adminRoutes = new Hono<AppEnv>();
adminRoutes.use('*', requireAdmin);

async function memberOr404(c: Parameters<typeof getUserById>[0], id: number) {
  return getUserById(c, id);
}

adminRoutes.get('/stats', async (c) => {
  const statusRows = await c.env.DB.prepare('SELECT status, COUNT(*) AS count FROM users GROUP BY status').all<{ status: string; count: number }>();
  const counts = new Map((statusRows.results || []).map((r) => [r.status, r.count]));
  const viewsRow = await c.env.DB.prepare('SELECT COALESCE(SUM(views),0) AS total FROM users').first<{ total: number }>();
  const searchRow = await c.env.DB.prepare("SELECT COALESCE(SUM(count),0) AS total FROM analytics_daily WHERE kind = 'search'").first<{ total: number }>();
  const cutoff7 = new Date(Date.now() - 7 * 86400 * 1000).toISOString();
  const signups = await c.env.DB.prepare('SELECT COUNT(*) AS total FROM users WHERE created_at >= ?').bind(cutoff7).first<{ total: number }>();
  const cutoff14 = new Date(Date.now() - 14 * 86400 * 1000).toISOString().slice(0, 10);
  const visitRows = await c.env.DB.prepare(
    "SELECT day, COALESCE(SUM(count),0) AS count FROM analytics_daily WHERE kind = 'page' AND day >= ? GROUP BY day ORDER BY day"
  )
    .bind(cutoff14)
    .all<{ day: string; count: number }>();
  const visitMap = new Map((visitRows.results || []).map((r) => [r.day, r.count]));
  const visits14d: { day: string; count: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400 * 1000).toISOString().slice(0, 10);
    visits14d.push({ day: d, count: visitMap.get(d) || 0 });
  }
  const recentRows = await c.env.DB.prepare(
    'SELECT id, handle, full_name_ar, email, status, created_at FROM users ORDER BY created_at DESC LIMIT 6'
  ).all<{ id: number; handle: string; full_name_ar: string; email: string; status: string; created_at: string }>();

  const stats: AdminStats = {
    total: [...counts.values()].reduce((a, b) => a + b, 0),
    approved: counts.get('approved') || 0,
    pending: counts.get('pending') || 0,
    rejected: counts.get('rejected') || 0,
    suspended: counts.get('suspended') || 0,
    views: viewsRow?.total || 0,
    searches: searchRow?.total || 0,
    signups7d: signups?.total || 0,
    visits14d,
    recent: (recentRows.results || []).map((r) => ({
      id: r.id,
      handle: r.handle,
      fullNameAr: r.full_name_ar,
      email: r.email,
      status: r.status as AdminStats['recent'][number]['status'],
      createdAt: r.created_at
    }))
  };
  return c.json({ stats });
});

adminRoutes.get('/members', async (c) => {
  const q = (c.req.query('q') || '').trim().slice(0, 80);
  const status = (c.req.query('status') || '').trim();
  const page = Math.max(1, Math.min(100, Number(c.req.query('page') || 1) || 1));
  const limit = 20;
  const where: string[] = ['1=1'];
  const binds: (string | number)[] = [];
  if (q) {
    const like = `%${escapeLike(q.toLowerCase())}%`;
    where.push("(LOWER(handle) LIKE ? ESCAPE '\\' OR LOWER(full_name_ar) LIKE ? ESCAPE '\\' OR LOWER(full_name_en) LIKE ? ESCAPE '\\' OR LOWER(email) LIKE ? ESCAPE '\\')");
    binds.push(like, like, like, like);
  }
  if (['pending', 'approved', 'rejected', 'suspended'].includes(status)) {
    where.push('status = ?');
    binds.push(status);
  }
  const whereSql = where.join(' AND ');
  const countRow = await c.env.DB.prepare(`SELECT COUNT(*) AS total FROM users WHERE ${whereSql}`).bind(...binds).first<{ total: number }>();
  const { results } = await c.env.DB.prepare(`SELECT ${USER_COLUMNS} FROM users WHERE ${whereSql} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
    .bind(...binds, limit, (page - 1) * limit)
    .all<UserRow>();
  const total = countRow?.total || 0;
  return c.json({
    items: (results || []).map(toAdminMember),
    total,
    page,
    pages: Math.max(1, Math.ceil(total / limit))
  });
});

adminRoutes.get('/members/:id', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isInteger(id)) return jsonError(c, 400, 'invalid_id', 'Invalid member id');
  const row = await memberOr404(c.env, id);
  if (!row) return jsonError(c, 404, 'not_found', 'Member not found');
  return c.json({ member: toPrivate(row), consent: row.consent });
});

async function loadTarget(c: Context<AppEnv>, adminId: number) {
  const id = Number(c.req.param('id'));
  if (!Number.isInteger(id)) return { error: 'invalid_id' as const };
  if (id === adminId) return { error: 'self' as const };
  const row = await getUserById(c.env, id);
  if (!row) return { error: 'not_found' as const };
  return { row };
}

adminRoutes.post('/members/:id/approve', async (c) => {
  const admin = c.get('user')!;
  const target = await loadTarget(c, admin.id);
  if (target.error === 'invalid_id') return jsonError(c, 400, 'invalid_id', 'Invalid member id');
  if (target.error === 'self') return jsonError(c, 400, 'self_action', 'Cannot approve your own account');
  if (target.error === 'not_found') return jsonError(c, 404, 'not_found', 'Member not found');
  const row = target.row!;
  const now = new Date().toISOString();
  await c.env.DB.prepare(
    "UPDATE users SET status = 'approved', visible = 1, approved_at = COALESCE(approved_at, ?), approved_by = ?, rejection_reason = '', updated_at = ? WHERE id = ?"
  )
    .bind(now, admin.id, now, row.id)
    .run();
  c.executionCtx.waitUntil(
    sendOrQueue(c.env, {
      to: row.email,
      template: 'approved',
      subject: EMAIL_SUBJECTS.approved,
      html: approvedEmail(row.full_name_ar, row.handle, c.env.APP_URL)
    })
  );
  await audit(c.env, admin.id, 'member_approved', 'user', String(row.id));
  const fresh = await getUserById(c.env, row.id);
  return c.json({ member: fresh ? toPrivate(fresh) : null });
});

adminRoutes.post('/members/:id/reject', async (c) => {
  const admin = c.get('user')!;
  const target = await loadTarget(c, admin.id);
  if (target.error) return jsonError(c, target.error === 'self' ? 400 : target.error === 'not_found' ? 404 : 400, target.error, 'Cannot perform action');
  const row = target.row!;
  const parsed = await parseBody(c, adminRejectSchema);
  if (parsed.response) return parsed.response;
  const { reason } = parsed.data!;
  await c.env.DB.prepare("UPDATE users SET status = 'rejected', visible = 0, rejection_reason = ?, updated_at = ? WHERE id = ?")
    .bind(reason, new Date().toISOString(), row.id)
    .run();
  c.executionCtx.waitUntil(
    sendOrQueue(c.env, {
      to: row.email,
      template: 'rejected',
      subject: EMAIL_SUBJECTS.rejected,
      html: rejectedEmail(row.full_name_ar, reason, c.env.APP_URL)
    })
  );
  await audit(c.env, admin.id, 'member_rejected', 'user', String(row.id), { reason });
  const fresh = await getUserById(c.env, row.id);
  return c.json({ member: fresh ? toPrivate(fresh) : null });
});

adminRoutes.post('/members/:id/suspend', async (c) => {
  const admin = c.get('user')!;
  const target = await loadTarget(c, admin.id);
  if (target.error) return jsonError(c, target.error === 'not_found' ? 404 : 400, target.error, 'Cannot perform action');
  const row = target.row!;
  await c.env.DB.prepare("UPDATE users SET status = 'suspended', visible = 0, updated_at = ? WHERE id = ?")
    .bind(new Date().toISOString(), row.id)
    .run();
  c.executionCtx.waitUntil(
    sendOrQueue(c.env, {
      to: row.email,
      template: 'suspended',
      subject: EMAIL_SUBJECTS.suspended,
      html: suspendedEmail(row.full_name_ar, c.env.APP_URL)
    })
  );
  await audit(c.env, admin.id, 'member_suspended', 'user', String(row.id));
  const fresh = await getUserById(c.env, row.id);
  return c.json({ member: fresh ? toPrivate(fresh) : null });
});

adminRoutes.post('/members/:id/restore', async (c) => {
  const admin = c.get('user')!;
  const target = await loadTarget(c, admin.id);
  if (target.error) return jsonError(c, target.error === 'not_found' ? 404 : 400, target.error, 'Cannot perform action');
  const row = target.row!;
  const now = new Date().toISOString();
  await c.env.DB.prepare("UPDATE users SET status = 'approved', visible = 1, updated_at = ? WHERE id = ?").bind(now, row.id).run();
  await audit(c.env, admin.id, 'member_restored', 'user', String(row.id));
  const fresh = await getUserById(c.env, row.id);
  return c.json({ member: fresh ? toPrivate(fresh) : null });
});

adminRoutes.post('/members/:id/feature', async (c) => {
  const admin = c.get('user')!;
  const target = await loadTarget(c, admin.id);
  if (target.error) return jsonError(c, target.error === 'not_found' ? 404 : 400, target.error, 'Cannot perform action');
  const row = target.row!;
  if (row.status !== 'approved') return jsonError(c, 400, 'not_approved', 'Only approved profiles can be featured');
  await c.env.DB.prepare('UPDATE users SET featured = ?, updated_at = ? WHERE id = ?')
    .bind(row.featured ? 0 : 1, new Date().toISOString(), row.id)
    .run();
  await audit(c.env, admin.id, row.featured ? 'member_unfeatured' : 'member_featured', 'user', String(row.id));
  const fresh = await getUserById(c.env, row.id);
  return c.json({ member: fresh ? toPrivate(fresh) : null });
});

adminRoutes.post('/members/:id/visibility', async (c) => {
  const admin = c.get('user')!;
  const target = await loadTarget(c, admin.id);
  if (target.error) return jsonError(c, target.error === 'not_found' ? 404 : 400, target.error, 'Cannot perform action');
  const row = target.row!;
  if (row.status !== 'approved') return jsonError(c, 400, 'not_approved', 'Only approved profiles can be toggled');
  await c.env.DB.prepare('UPDATE users SET visible = ?, updated_at = ? WHERE id = ?')
    .bind(row.visible ? 0 : 1, new Date().toISOString(), row.id)
    .run();
  await audit(c.env, admin.id, row.visible ? 'member_hidden' : 'member_shown', 'user', String(row.id));
  const fresh = await getUserById(c.env, row.id);
  return c.json({ member: fresh ? toPrivate(fresh) : null });
});

adminRoutes.get('/settings', async (c) => {
  return c.json({ settings: await getSettings(c.env) });
});

adminRoutes.put('/settings', async (c) => {
  const admin = c.get('user')!;
  const parsed = await parseBody(c, adminSettingsSchema);
  if (parsed.response) return parsed.response;
  const s = parsed.data!;
  await setSetting(c.env, 'registration_open', String(s.registrationOpen ?? true));
  await setSetting(c.env, 'announcement_ar', s.announcementAr ?? '');
  await setSetting(c.env, 'announcement_en', s.announcementEn ?? '');
  await setSetting(c.env, 'admin_notify', String(s.adminNotify ?? true));
  await audit(c.env, admin.id, 'settings_updated', 'settings', 'site', s);
  return c.json({ settings: await getSettings(c.env) });
});

adminRoutes.get('/audit', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT a.id, a.actor_id, a.action, a.target_type, a.target_id, a.meta, a.created_at, u.full_name_ar AS actor_name
     FROM audit_log a LEFT JOIN users u ON u.id = a.actor_id ORDER BY a.id DESC LIMIT 100`
  ).all();
  return c.json({ items: results || [] });
});

adminRoutes.get('/emails', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT id, to_email, template, subject, status, error, created_at, sent_at FROM email_outbox ORDER BY id DESC LIMIT 60'
  ).all();
  return c.json({ items: results || [], resendConfigured: !!c.env.RESEND_API_KEY });
});

adminRoutes.post('/emails/:id/retry', async (c) => {
  const admin = c.get('user')!;
  if (!c.env.RESEND_API_KEY) return jsonError(c, 400, 'resend_missing', 'Resend API key is not configured');
  const id = Number(c.req.param('id'));
  if (!Number.isInteger(id)) return jsonError(c, 400, 'invalid_id', 'Invalid email id');
  const result = await dispatchEmail(c.env, id);
  await audit(c.env, admin.id, 'email_retried', 'email', String(id), result);
  return c.json(result);
});

adminRoutes.post('/emails/test', async (c) => {
  const admin = c.get('user')!;
  const rl = await rateLimit(c.env, `email-test:${admin.id}`, 5, 3600);
  if (!rl.ok) return tooMany(c, rl.retryAfter);
  if (!c.env.RESEND_API_KEY) return jsonError(c, 400, 'resend_missing', 'Resend API key is not configured');
  await sendOrQueue(c.env, {
    to: c.env.ADMIN_EMAIL,
    template: 'test',
    subject: EMAIL_SUBJECTS.test,
    html: testEmail()
  });
  await audit(c.env, admin.id, 'email_test_sent', 'email', 'test');
  return c.json({ ok: true });
});

adminRoutes.get('/export.csv', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT id, handle, full_name_ar, full_name_en, email, specialty_ar, city, status, views, created_at, approved_at FROM users ORDER BY id'
  ).all<Record<string, unknown>>();
  const headers = ['member_no', 'handle', 'full_name_ar', 'full_name_en', 'email', 'specialty_ar', 'city', 'status', 'views', 'created_at', 'approved_at'];
  const lines = [headers.join(',')];
  for (const r of results || []) {
    const values = [
      `C${String(r.id).padStart(6, '0')}`,
      r.handle,
      r.full_name_ar,
      r.full_name_en,
      r.email,
      r.specialty_ar,
      r.city,
      r.status,
      r.views,
      r.created_at,
      r.approved_at || ''
    ].map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`);
    lines.push(values.join(','));
  }
  c.header('Content-Type', 'text/csv; charset=utf-8');
  c.header('Content-Disposition', `attachment; filename="ksa-doctor-members-${new Date().toISOString().slice(0, 10)}.csv"`);
  return c.body('\ufeff' + lines.join('\r\n'));
});
