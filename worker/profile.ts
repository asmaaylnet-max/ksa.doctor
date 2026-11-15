import { Hono } from 'hono';
import type { AppEnv } from './env';
import { requireAuth } from './auth';
import {
  adminNewMemberEmail,
  dispatchEmail,
  EMAIL_SUBJECTS,
  queueEmail
} from './email';
import {
  audit,
  cleanButtons,
  cleanMediaList,
  cleanServices,
  cleanSocials,
  cleanVideos,
  jsonError,
  parseBody,
  parseArray,
  rateLimit,
  tooMany
} from './util';
import { profileUpdateSchema, linksUpdateSchema, consentSchema } from '../shared/schemas';
import { getUserById, toPrivate } from './users';
import type { MediaItem } from '../shared/types';

export const profileRoutes = new Hono<AppEnv>();
profileRoutes.use('/me/*', requireAuth);
profileRoutes.use('/me', requireAuth);

profileRoutes.get('/me', async (c) => {
  const user = c.get('user')!;
  const fresh = await getUserById(c.env, user.id);
  return c.json({ user: toPrivate(fresh || user) });
});

profileRoutes.put('/me/profile', async (c) => {
  const user = c.get('user')!;
  const parsed = await parseBody(c, profileUpdateSchema);
  if (parsed.response) return parsed.response;
  const raw = parsed.data!;
  const data = {
    fullNameAr: raw.fullNameAr,
    fullNameEn: raw.fullNameEn ?? '',
    specialtyAr: raw.specialtyAr,
    specialtyEn: raw.specialtyEn ?? '',
    titleAr: raw.titleAr ?? '',
    titleEn: raw.titleEn ?? '',
    bioAr: raw.bioAr ?? '',
    bioEn: raw.bioEn ?? '',
    city: raw.city ?? '',
    phone: raw.phone ?? '',
    whatsapp: raw.whatsapp ?? '',
    publicEmail: raw.publicEmail ?? '',
    website: raw.website ?? '',
    accent: raw.accent || '#006830'
  };
  if (data.website && !/^https?:\/\//i.test(data.website)) {
    return jsonError(c, 422, 'validation_error', 'Website must start with http(s)', { website: 'url_invalid' });
  }
  const now = new Date().toISOString();
  await c.env.DB.prepare(
    `UPDATE users SET full_name_ar = ?, full_name_en = ?, specialty_ar = ?, specialty_en = ?, title_ar = ?, title_en = ?,
     bio_ar = ?, bio_en = ?, city = ?, phone = ?, whatsapp = ?, public_email = ?, website = ?, accent = ?, updated_at = ?
     WHERE id = ?`
  )
    .bind(
      data.fullNameAr,
      data.fullNameEn,
      data.specialtyAr,
      data.specialtyEn,
      data.titleAr,
      data.titleEn,
      data.bioAr,
      data.bioEn,
      data.city,
      data.phone,
      data.whatsapp,
      data.publicEmail,
      data.website,
      data.accent,
      now,
      user.id
    )
    .run();
  await audit(c.env, user.id, 'profile_updated', 'user', String(user.id));
  const fresh = await getUserById(c.env, user.id);
  return c.json({ user: fresh ? toPrivate(fresh) : null });
});

profileRoutes.put('/me/links', async (c) => {
  const user = c.get('user')!;
  const parsed = await parseBody(c, linksUpdateSchema);
  if (parsed.response) return parsed.response;
  const data = parsed.data!;
  const socials = cleanSocials(data.socials ?? []);
  const services = cleanServices(data.services ?? []);
  const buttons = cleanButtons(data.buttons ?? []);
  const videos = cleanVideos(data.videos ?? []);
  await c.env.DB.prepare(
    'UPDATE users SET socials = ?, services = ?, buttons = ?, videos = ?, updated_at = ? WHERE id = ?'
  )
    .bind(JSON.stringify(socials), JSON.stringify(services), JSON.stringify(buttons), JSON.stringify(videos), new Date().toISOString(), user.id)
    .run();
  await audit(c.env, user.id, 'links_updated', 'user', String(user.id));
  const fresh = await getUserById(c.env, user.id);
  return c.json({ user: fresh ? toPrivate(fresh) : null });
});

profileRoutes.post('/me/resubmit', async (c) => {
  const user = c.get('user')!;
  if (user.status !== 'rejected') return c.json({ user: toPrivate(user) });
  await c.env.DB.prepare("UPDATE users SET status = 'pending', rejection_reason = '', updated_at = ? WHERE id = ?")
    .bind(new Date().toISOString(), user.id)
    .run();
  const mailId = await queueEmail(c.env, {
    to: c.env.ADMIN_EMAIL,
    template: 'admin_resubmit',
    subject: `إعادة إرسال ملف للمراجعة — ${user.full_name_ar}`,
    html: adminNewMemberEmail(user.full_name_ar, user.email, user.handle, c.env.APP_URL)
  });
  if (mailId) c.executionCtx.waitUntil(dispatchEmail(c.env, mailId));
  await audit(c.env, user.id, 'profile_resubmitted', 'user', String(user.id));
  const fresh = await getUserById(c.env, user.id);
  return c.json({ user: fresh ? toPrivate(fresh) : null });
});

profileRoutes.post('/me/consent', async (c) => {
  const user = c.get('user')!;
  const parsed = await parseBody(c, consentSchema);
  if (parsed.response) return parsed.response;
  await c.env.DB.prepare('UPDATE users SET consent = ? WHERE id = ?')
    .bind(JSON.stringify({ ...parsed.data!, at: new Date().toISOString() }), user.id)
    .run();
  return c.json({ ok: true });
});

profileRoutes.get('/me/export', async (c) => {
  const user = c.get('user')!;
  const fresh = await getUserById(c.env, user.id);
  const payload = {
    exportedAt: new Date().toISOString(),
    platform: 'ksa.doctor',
    profile: fresh ? toPrivate(fresh) : null,
    note: 'This export contains your profile data. Passwords and sessions are never exported.'
  };
  c.header('Content-Disposition', `attachment; filename="ksa-doctor-${user.handle}.json"`);
  return c.json(payload);
});

const ALLOWED_TYPES: Record<string, { ext: string; mime: string }> = {
  'image/jpeg': { ext: 'jpg', mime: 'image/jpeg' },
  'image/png': { ext: 'png', mime: 'image/png' },
  'image/webp': { ext: 'webp', mime: 'image/webp' }
};

function detectImage(bytes: Uint8Array): { ext: string; mime: string } | null {
  if (bytes.length >= 12 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
    return ALLOWED_TYPES['image/webp'];
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return ALLOWED_TYPES['image/jpeg'];
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return ALLOWED_TYPES['image/png'];
  return null;
}

profileRoutes.post('/me/media', async (c) => {
  const user = c.get('user')!;
  const rl = await rateLimit(c.env, `media:${user.id}`, 60, 3600);
  if (!rl.ok) return tooMany(c, rl.retryAfter);

  let form: FormData;
  try {
    form = await c.req.formData();
  } catch {
    return jsonError(c, 400, 'invalid_form', 'Invalid upload');
  }
  const kind = String(form.get('kind') || '');
  if (!['avatar', 'cover', 'skill', 'work'].includes(kind)) {
    return jsonError(c, 400, 'invalid_kind', 'Invalid media kind');
  }
  const entry = form.get('file');
  if (!entry || typeof entry === 'string' || typeof (entry as File).arrayBuffer !== 'function') {
    return jsonError(c, 400, 'file_required', 'No file uploaded');
  }
  const file = entry as File;
  if (file.size > 8 * 1024 * 1024) return jsonError(c, 413, 'file_too_large', 'Image must be under 8MB');
  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const detected = detectImage(head);
  if (!detected) return jsonError(c, 415, 'unsupported_type', 'Only JPEG, PNG or WebP images are allowed');

  const indexRaw = form.get('index');
  const index = indexRaw === null ? null : Number(indexRaw);
  const captionAr = String(form.get('captionAr') || '').slice(0, 120);
  const captionEn = String(form.get('captionEn') || '').slice(0, 120);

  const fresh = await getUserById(c.env, user.id);
  if (!fresh) return jsonError(c, 404, 'not_found', 'User not found');

  let skills = cleanMediaList(parseArray(fresh.skills));
  let works = cleanMediaList(parseArray(fresh.works));
  let oldKey = '';
  let list = kind === 'skill' ? skills : kind === 'work' ? works : null;
  if (list) {
    if (index !== null && Number.isInteger(index) && index >= 0 && index < list.length) {
      oldKey = list[index].key;
    } else if (list.length >= 4) {
      return jsonError(c, 400, 'media_limit', 'Maximum of 4 images reached');
    }
  }
  if (kind === 'avatar' && fresh.avatar_key) oldKey = fresh.avatar_key;
  if (kind === 'cover' && fresh.cover_key) oldKey = fresh.cover_key;

  const key = `${user.id}/${kind}-${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 8)}.${detected.ext}`;
  const bytes = await file.arrayBuffer();
  await c.env.MEDIA.put(key, bytes, {
    httpMetadata: { contentType: detected.mime, cacheControl: 'public, max-age=31536000, immutable' },
    customMetadata: { owner: String(user.id), kind }
  });

  if (kind === 'avatar') {
    await c.env.DB.prepare('UPDATE users SET avatar_key = ?, updated_at = ? WHERE id = ?')
      .bind(key, new Date().toISOString(), user.id)
      .run();
  } else if (kind === 'cover') {
    await c.env.DB.prepare('UPDATE users SET cover_key = ?, updated_at = ? WHERE id = ?')
      .bind(key, new Date().toISOString(), user.id)
      .run();
  } else {
    const item: MediaItem = { key, captionAr, captionEn };
    if (list && index !== null && Number.isInteger(index) && index >= 0 && index < list.length) {
      list[index] = item;
    } else if (list) {
      list.push(item);
    }
    if (kind === 'skill') skills = list || skills;
    if (kind === 'work') works = list || works;
    await c.env.DB.prepare('UPDATE users SET skills = ?, works = ?, updated_at = ? WHERE id = ?')
      .bind(JSON.stringify(skills), JSON.stringify(works), new Date().toISOString(), user.id)
      .run();
  }

  if (oldKey && oldKey !== key) {
    try {
      await c.env.MEDIA.delete(oldKey);
    } catch {
      /* ignore orphan cleanup errors */
    }
  }
  const updated = await getUserById(c.env, user.id);
  return c.json({ user: updated ? toPrivate(updated) : null, key });
});

profileRoutes.post('/me/media/delete', async (c) => {
  const user = c.get('user')!;
  let body: { kind?: string; key?: string };
  try {
    body = await c.req.json();
  } catch {
    return jsonError(c, 400, 'invalid_json', 'Invalid JSON body');
  }
  const kind = String(body.kind || '');
  const key = String(body.key || '');
  if (!['avatar', 'cover', 'skill', 'work'].includes(kind)) return jsonError(c, 400, 'invalid_kind', 'Invalid kind');
  if (!key.startsWith(`${user.id}/`)) return jsonError(c, 403, 'forbidden', 'Not your media');

  const fresh = await getUserById(c.env, user.id);
  if (!fresh) return jsonError(c, 404, 'not_found', 'User not found');
  let skills = cleanMediaList(parseArray(fresh.skills));
  let works = cleanMediaList(parseArray(fresh.works));
  let cleared = false;
  if (kind === 'avatar' && fresh.avatar_key === key) {
    await c.env.DB.prepare('UPDATE users SET avatar_key = ? WHERE id = ?').bind('', user.id).run();
    cleared = true;
  } else if (kind === 'cover' && fresh.cover_key === key) {
    await c.env.DB.prepare('UPDATE users SET cover_key = ? WHERE id = ?').bind('', user.id).run();
    cleared = true;
  } else if (kind === 'skill') {
    skills = skills.filter((m) => m.key !== key);
    await c.env.DB.prepare('UPDATE users SET skills = ? WHERE id = ?').bind(JSON.stringify(skills), user.id).run();
    cleared = true;
  } else if (kind === 'work') {
    works = works.filter((m) => m.key !== key);
    await c.env.DB.prepare('UPDATE users SET works = ? WHERE id = ?').bind(JSON.stringify(works), user.id).run();
    cleared = true;
  }
  if (cleared) {
    try {
      await c.env.MEDIA.delete(key);
    } catch {
      /* ignore */
    }
  }
  const updated = await getUserById(c.env, user.id);
  return c.json({ user: updated ? toPrivate(updated) : null });
});
