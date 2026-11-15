import type { Context } from 'hono';
import type { ZodSchema } from 'zod';
import type { AppEnv, Env } from './env';
import { sha256Hex } from '../shared/auth';
import { SOCIAL_MAP } from '../shared/data';
import type { CustomButton, MediaItem, Service, SocialLink, VideoItem } from '../shared/types';

export function jsonError(
  c: Context<AppEnv>,
  status: number,
  code: string,
  message: string,
  fields?: Record<string, string>
) {
  return c.json({ error: { code, message, ...(fields ? { fields } : {}) } }, status as 400);
}

export function fieldErrors(error: { issues: { path: (string | number)[]; message: string }[] }): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_';
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export async function parseBody<T>(
  c: Context<AppEnv>,
  schema: ZodSchema<T>
): Promise<{ data?: T; response?: Response }> {
  let raw: unknown;
  try {
    raw = await c.req.json();
  } catch {
    return { response: jsonError(c, 400, 'invalid_json', 'Invalid JSON body') };
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return {
      response: jsonError(c, 422, 'validation_error', 'Please check the highlighted fields', fieldErrors(parsed.error))
    };
  }
  return { data: parsed.data };
}

export function clientIp(c: Context<AppEnv>): string {
  return c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For')?.split(',')[0]?.trim() || '0.0.0.0';
}

export function userAgent(c: Context<AppEnv>): string {
  return (c.req.header('User-Agent') || '').slice(0, 300);
}

export async function rateLimit(
  env: Env,
  key: string,
  limit: number,
  windowSeconds: number
): Promise<{ ok: boolean; retryAfter: number }> {
  const now = Math.floor(Date.now() / 1000);
  const row = await env.DB.prepare('SELECT count, reset_at FROM rate_limits WHERE key = ?')
    .bind(key)
    .first<{ count: number; reset_at: number }>();
  if (!row || row.reset_at <= now) {
    await env.DB.prepare('INSERT INTO rate_limits (key, count, reset_at) VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET count = 1, reset_at = excluded.reset_at')
      .bind(key, now + windowSeconds)
      .run();
    if (Math.random() < 0.02) {
      await env.DB.prepare('DELETE FROM rate_limits WHERE reset_at < ?').bind(now - 86400).run();
    }
    return { ok: true, retryAfter: 0 };
  }
  if (row.count >= limit) return { ok: false, retryAfter: Math.max(1, row.reset_at - now) };
  await env.DB.prepare('UPDATE rate_limits SET count = count + 1 WHERE key = ?').bind(key).run();
  return { ok: true, retryAfter: 0 };
}

export function tooMany(c: Context<AppEnv>, retryAfter: number) {
  c.header('Retry-After', String(retryAfter));
  return jsonError(c, 429, 'rate_limited', 'Too many attempts. Please try again later.');
}

export function parseArray<T>(value: string | null | undefined, fallback: T[] = []): T[] {
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as T[]) : fallback;
  } catch {
    return fallback;
  }
}

export function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function cleanSocials(input: { platform: string; value: string }[]): SocialLink[] {
  const out: SocialLink[] = [];
  const seen = new Set<string>();
  for (const item of input) {
    const platform = item.platform as SocialLink['platform'];
    if (!SOCIAL_MAP[platform] || seen.has(platform)) continue;
    const value = item.value.trim().slice(0, 300);
    if (!value) continue;
    if (value.startsWith('javascript:') || value.startsWith('data:')) continue;
    if (SOCIAL_MAP[platform].kind === 'url' && !/^https?:\/\//i.test(value)) continue;
    seen.add(platform);
    out.push({ platform, value });
  }
  return out.slice(0, 12);
}

export function cleanServices(
  input: { id?: string; titleAr: string; titleEn?: string; descAr?: string; descEn?: string; icon?: string }[]
): Service[] {
  return input
    .filter((s) => s.titleAr.trim().length >= 2)
    .map((s) => ({
      id: s.id || crypto.randomUUID(),
      titleAr: s.titleAr.trim().slice(0, 80),
      titleEn: (s.titleEn || '').trim().slice(0, 80),
      descAr: (s.descAr || '').trim().slice(0, 240),
      descEn: (s.descEn || '').trim().slice(0, 240),
      icon: (s.icon || 'stethoscope').slice(0, 40) || 'stethoscope'
    }))
    .slice(0, 8);
}

export function cleanButtons(
  input: { id?: string; labelAr: string; labelEn?: string; url: string; icon?: string; color?: string }[]
): CustomButton[] {
  const out: CustomButton[] = [];
  for (const b of input) {
    const labelAr = b.labelAr.trim().slice(0, 60);
    if (!labelAr) continue;
    let url = b.url.trim();
    if (!/^https?:\/\//i.test(url)) continue;
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') continue;
      url = parsed.toString();
    } catch {
      continue;
    }
    out.push({
      id: b.id || crypto.randomUUID(),
      labelAr,
      labelEn: (b.labelEn || '').trim().slice(0, 60),
      url,
      icon: (b.icon || 'link').slice(0, 40) || 'link',
      color: /^#[0-9a-fA-F]{6}$/.test(b.color || '') ? b.color! : '#006830'
    });
  }
  return out.slice(0, 6);
}

export function cleanVideos(
  input: { id?: string; url: string; videoId: string; titleAr?: string; titleEn?: string }[]
): VideoItem[] {
  const out: VideoItem[] = [];
  const seen = new Set<string>();
  for (const v of input) {
    if (!/^[A-Za-z0-9_-]{11}$/.test(v.videoId) || seen.has(v.videoId)) continue;
    seen.add(v.videoId);
    out.push({
      id: v.id || crypto.randomUUID(),
      url: v.url.slice(0, 500),
      videoId: v.videoId,
      titleAr: (v.titleAr || '').trim().slice(0, 120),
      titleEn: (v.titleEn || '').trim().slice(0, 120)
    });
  }
  return out.slice(0, 6);
}

export function cleanMediaList(input: unknown, max = 4): MediaItem[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((item): item is MediaItem => !!item && typeof item === 'object' && typeof (item as MediaItem).key === 'string')
    .map((item) => ({
      key: item.key,
      captionAr: (item.captionAr || '').slice(0, 120),
      captionEn: (item.captionEn || '').slice(0, 120)
    }))
    .slice(0, max);
}

export async function audit(
  env: Env,
  actorId: number | null,
  action: string,
  targetType = '',
  targetId = '',
  meta: Record<string, unknown> = {}
) {
  await env.DB.prepare('INSERT INTO audit_log (actor_id, action, target_type, target_id, meta) VALUES (?, ?, ?, ?, ?)')
    .bind(actorId, action, targetType, String(targetId), JSON.stringify(meta))
    .run();
}

export async function track(env: Env, kind: 'page' | 'search' | 'profile') {
  const day = new Date().toISOString().slice(0, 10);
  await env.DB.prepare(
    'INSERT INTO analytics_daily (day, kind, count) VALUES (?, ?, 1) ON CONFLICT(day, kind) DO UPDATE SET count = count + 1'
  )
    .bind(day, kind)
    .run();
}

export async function viewerHash(env: Env, ip: string, ua: string): Promise<string> {
  return (await sha256Hex(`view|${ip}|${ua}|${env.SESSION_SECRET}`)).slice(0, 24);
}

export interface Settings {
  registrationOpen: boolean;
  announcementAr: string;
  announcementEn: string;
  adminNotify: boolean;
}

export async function getSettings(env: Env): Promise<Settings> {
  const { results } = await env.DB.prepare('SELECT key, value FROM settings').all<{ key: string; value: string }>();
  const map = new Map((results || []).map((r) => [r.key, r.value]));
  return {
    registrationOpen: map.get('registration_open') !== 'false',
    announcementAr: map.get('announcement_ar') || '',
    announcementEn: map.get('announcement_en') || '',
    adminNotify: map.get('admin_notify') !== 'false'
  };
}

export async function setSetting(env: Env, key: string, value: string) {
  await env.DB.prepare(
    'INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at'
  )
    .bind(key, value, new Date().toISOString())
    .run();
}

export function mediaUrl(key: string): string {
  return key ? `/media/${key}` : '';
}

export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (m) => `\\${m}`);
}

export function isValidHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}
