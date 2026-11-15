import { Hono } from 'hono';
import type { AppEnv } from './env';
import { CITY_MAP, SPECIALTIES, SPECIALTY_MAP, socialHref, SOCIAL_MAP } from '../shared/data';
import type { SearchResult, UserPublic } from '../shared/types';
import { trackSchema } from '../shared/schemas';
import { escapeLike, getSettings, jsonError, parseBody, rateLimit, tooMany, track, viewerHash } from './util';
import { getUserByHandle, toPublic } from './users';

export const publicRoutes = new Hono<AppEnv>();

function publicResult(row: ReturnType<typeof toPublic>): UserPublic {
  return row;
}

publicRoutes.get('/public/:handle', async (c) => {
  const handle = (c.req.param('handle') || '').toLowerCase();
  if (!/^[a-z0-9]{3,24}$/.test(handle)) return jsonError(c, 404, 'profile_not_found', 'Profile not found');
  const row = await getUserByHandle(c.env, handle);
  if (!row) return jsonError(c, 404, 'profile_not_found', 'Profile not found');

  const viewer = c.get('user');
  const isOwner = viewer?.id === row.id;
  const isAdmin = viewer?.role === 'admin';
  const preview = (isOwner || isAdmin) && row.status !== 'approved';

  if (row.status !== 'approved' || !row.visible) {
    if (preview) {
      return c.json({ state: row.status, profile: publicResult(toPublic(row)), preview: true });
    }
    if (row.status === 'pending') {
      return c.json({ state: 'pending', handle });
    }
    return jsonError(c, 404, 'profile_unavailable', 'Profile unavailable');
  }

  const ip = c.get('ip');
  const ua = c.get('ua');
  const viewerKey = await viewerHash(c.env, ip, ua);
  const day = new Date().toISOString().slice(0, 10);
  try {
    const inserted = await c.env.DB.prepare('INSERT OR IGNORE INTO profile_views (viewer, user_id, day) VALUES (?, ?, ?)')
      .bind(viewerKey, row.id, day)
      .run();
    if (inserted.meta.changes > 0) {
      await c.env.DB.prepare('UPDATE users SET views = views + 1 WHERE id = ?').bind(row.id).run();
      await track(c.env, 'profile');
      if (Math.random() < 0.02) {
        const cutoff = new Date(Date.now() - 90 * 86400 * 1000).toISOString().slice(0, 10);
        await c.env.DB.prepare('DELETE FROM profile_views WHERE day < ?').bind(cutoff).run();
      }
    }
  } catch {
    /* view counting must never break a profile */
  }

  return c.json({ state: 'approved', profile: publicResult(toPublic(row)) });
});

publicRoutes.get('/public/:handle/vcard', async (c) => {
  const handle = (c.req.param('handle') || '').toLowerCase();
  const row = await getUserByHandle(c.env, handle);
  if (!row || row.status !== 'approved' || !row.visible) return jsonError(c, 404, 'profile_not_found', 'Profile not found');
  const p = toPublic(row);
  const lines: string[] = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${vcardEscape(p.fullNameAr)};;;;`,
    `FN:${vcardEscape(p.fullNameAr)}`,
    `ORG:${vcardEscape('أطباء المملكة العربية السعودية')}`,
    `TITLE:${vcardEscape(p.specialtyAr || 'طبيب')}`,
    `URL:${c.env.APP_URL}/${p.handle}`,
    `REV:${new Date().toISOString()}`
  ];
  if (p.phone) lines.push(`TEL;TYPE=CELL:${vcardEscape(p.phone)}`);
  if (p.whatsapp) lines.push(`TEL;TYPE=WORK:${vcardEscape(p.whatsapp)}`);
  if (p.publicEmail) lines.push(`EMAIL;TYPE=WORK:${vcardEscape(p.publicEmail)}`);
  if (p.city && CITY_MAP[p.city]) {
    lines.push(`ADR;TYPE=WORK:;;${vcardEscape(CITY_MAP[p.city].ar)};;;${vcardEscape('المملكة العربية السعودية')}`);
  }
  for (const social of p.socials) {
    if (social.platform === 'email' || social.platform === 'phone') continue;
    const href = socialHref(social.platform, social.value);
    if (href) lines.push(`URL;TYPE=${vcardEscape(SOCIAL_MAP[social.platform]?.en || 'Social')}:${vcardEscape(href)}`);
  }
  if (p.bioAr) lines.push(`NOTE:${vcardEscape(p.bioAr.slice(0, 500))}`);
  if (p.avatarKey) lines.push(`PHOTO;VALUE=URI:${c.env.APP_URL}/media/${p.avatarKey}`);
  lines.push('END:VCARD');
  c.header('Content-Type', 'text/vcard; charset=utf-8');
  c.header('Content-Disposition', `attachment; filename="${p.handle}.vcf"`);
  c.header('Cache-Control', 'no-store');
  return c.body(lines.join('\r\n') + '\r\n');
});

function vcardEscape(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

publicRoutes.get('/search', async (c) => {
  const ip = c.get('ip');
  const rl = await rateLimit(c.env, `search:${ip}`, 120, 60);
  if (!rl.ok) return tooMany(c, rl.retryAfter);

  const q = (c.req.query('q') || '').trim().slice(0, 80);
  const specialty = (c.req.query('specialty') || '').trim().slice(0, 80);
  const city = (c.req.query('city') || '').trim().slice(0, 40);
  const page = Math.max(1, Math.min(50, Number(c.req.query('page') || 1) || 1));
  const limit = 12;
  const offset = (page - 1) * limit;

  const where: string[] = ["status = 'approved'", 'visible = 1'];
  const binds: (string | number)[] = [];

  if (q) {
    const like = `%${escapeLike(q.toLowerCase())}%`;
    const parts = [
      "LOWER(handle) LIKE ? ESCAPE '\\'",
      "LOWER(full_name_ar) LIKE ? ESCAPE '\\'",
      "LOWER(full_name_en) LIKE ? ESCAPE '\\'",
      "LOWER(specialty_ar) LIKE ? ESCAPE '\\'",
      "LOWER(specialty_en) LIKE ? ESCAPE '\\'",
      "LOWER(title_ar) LIKE ? ESCAPE '\\'",
      "LOWER(title_en) LIKE ? ESCAPE '\\'",
      "LOWER(bio_ar) LIKE ? ESCAPE '\\'",
      "LOWER(bio_en) LIKE ? ESCAPE '\\'"
    ];
    const qBinds: string[] = Array(9).fill(like);
    const cityMatches = Object.values(CITY_MAP).filter((ci) => ci.ar.includes(q) || ci.en.toLowerCase().includes(q.toLowerCase()));
    if (cityMatches.length) {
      parts.push(`city IN (${cityMatches.map(() => '?').join(',')})`);
      qBinds.push(...cityMatches.map((ci) => ci.key));
    }
    where.push(`(${parts.join(' OR ')})`);
    binds.push(...qBinds);
  }

  if (specialty) {
    const item = SPECIALTY_MAP[specialty] || SPECIALTIES.find((s) => s.ar === specialty || s.en.toLowerCase() === specialty.toLowerCase());
    if (item) {
      where.push('(specialty_ar = ? OR specialty_en = ?)');
      binds.push(item.ar, item.en);
    } else {
      where.push("(LOWER(specialty_ar) LIKE ? ESCAPE '\\' OR LOWER(specialty_en) LIKE ? ESCAPE '\\')");
      binds.push(`%${escapeLike(specialty.toLowerCase())}%`, `%${escapeLike(specialty.toLowerCase())}%`);
    }
  }

  if (city) {
    const item = CITY_MAP[city];
    if (item) {
      where.push('city = ?');
      binds.push(item.key);
    }
  }

  const whereSql = where.join(' AND ');
  interface SearchRow {
    handle: string;
    full_name_ar: string;
    full_name_en: string;
    specialty_ar: string;
    specialty_en: string;
    city: string;
    avatar_key: string;
    bio_ar: string;
    bio_en: string;
    featured: number;
  }
  const [countRow, rows] = await Promise.all([
    c.env.DB.prepare(`SELECT COUNT(*) AS total FROM users WHERE ${whereSql}`).bind(...binds).first<{ total: number }>(),
    c.env.DB.prepare(
      `SELECT handle, full_name_ar, full_name_en, specialty_ar, specialty_en, city, avatar_key, bio_ar, bio_en, featured
       FROM users WHERE ${whereSql}
       ORDER BY featured DESC, views DESC, approved_at DESC
       LIMIT ? OFFSET ?`
    )
      .bind(...binds, limit, offset)
      .all<SearchRow>()
  ]);

  const total = countRow?.total || 0;
  const items: SearchResult[] = (rows.results || []).map((r) => ({
    handle: r.handle,
    fullNameAr: r.full_name_ar,
    fullNameEn: r.full_name_en,
    specialtyAr: r.specialty_ar,
    specialtyEn: r.specialty_en,
    city: r.city,
    avatarKey: r.avatar_key,
    bioAr: r.bio_ar,
    bioEn: r.bio_en,
    featured: !!r.featured
  }));
  if (q || specialty || city) {
    c.executionCtx.waitUntil(track(c.env, 'search'));
  }
  c.header('Cache-Control', 'no-store');
  return c.json({ items, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
});

publicRoutes.get('/search/suggest', async (c) => {
  const q = (c.req.query('q') || '').trim().slice(0, 60);
  if (q.length < 2) return c.json({ items: [] });
  const like = `%${escapeLike(q.toLowerCase())}%`;
  const { results } = await c.env.DB.prepare(
    `SELECT handle, full_name_ar, full_name_en, specialty_ar, specialty_en, avatar_key
     FROM users WHERE status = 'approved' AND visible = 1
     AND (LOWER(handle) LIKE ? ESCAPE '\\' OR LOWER(full_name_ar) LIKE ? ESCAPE '\\'
       OR LOWER(full_name_en) LIKE ? ESCAPE '\\' OR LOWER(specialty_ar) LIKE ? ESCAPE '\\' OR LOWER(specialty_en) LIKE ? ESCAPE '\\')
     ORDER BY featured DESC, views DESC LIMIT 6`
  )
    .bind(like, like, like, like, like)
    .all();
  c.header('Cache-Control', 'public, max-age=30');
  return c.json({
    items: (results || []).map((r: Record<string, unknown>) => ({
      handle: r.handle,
      fullNameAr: r.full_name_ar,
      fullNameEn: r.full_name_en,
      specialtyAr: r.specialty_ar,
      specialtyEn: r.specialty_en,
      avatarKey: r.avatar_key
    }))
  });
});

publicRoutes.get('/meta', async (c) => {
  const [members, specialties, cities, settings] = await Promise.all([
    c.env.DB.prepare("SELECT COUNT(*) AS total FROM users WHERE status = 'approved' AND visible = 1").first<{ total: number }>(),
    c.env.DB.prepare(
      "SELECT specialty_ar, specialty_en, COUNT(*) AS count FROM users WHERE status = 'approved' AND visible = 1 AND specialty_ar != '' GROUP BY specialty_ar, specialty_en ORDER BY count DESC LIMIT 10"
    ).all<{ specialty_ar: string; specialty_en: string; count: number }>(),
    c.env.DB.prepare(
      "SELECT city, COUNT(*) AS count FROM users WHERE status = 'approved' AND visible = 1 AND city != '' GROUP BY city ORDER BY count DESC LIMIT 10"
    ).all<{ city: string; count: number }>(),
    getSettings(c.env)
  ]);
  const announcement =
    settings.announcementAr || settings.announcementEn
      ? { ar: settings.announcementAr, en: settings.announcementEn }
      : null;
  c.header('Cache-Control', 'public, max-age=45');
  return c.json({
    members: members?.total || 0,
    specialties: (specialties.results || []).map((s) => ({ ar: s.specialty_ar, en: s.specialty_en, count: s.count })),
    cities: (cities.results || []).map((ci) => ({ key: ci.city, count: ci.count })),
    announcement
  });
});

publicRoutes.post('/track', async (c) => {
  const ip = c.get('ip');
  const rl = await rateLimit(c.env, `track:${ip}`, 180, 3600);
  if (!rl.ok) return c.json({ ok: true });
  const parsed = await parseBody(c, trackSchema);
  if (parsed.response) return c.json({ ok: true });
  await track(c.env, parsed.data?.kind || 'page');
  return c.json({ ok: true });
});

publicRoutes.get('/health', async (c) => {
  try {
    await c.env.DB.prepare('SELECT 1').first();
    return c.json({ ok: true, service: 'ksa.doctor', time: new Date().toISOString() });
  } catch {
    return c.json({ ok: false }, 503);
  }
});
