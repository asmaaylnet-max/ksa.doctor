interface Env {
  DB: D1Database;
  BACKUPS: R2Bucket;
  APP_URL: string;
  FROM_EMAIL: string;
  ADMIN_EMAIL: string;
  CF_ACCOUNT_ID: string;
  D1_DATABASE_ID: string;
  CF_API_TOKEN: string;
  RESEND_API_KEY: string;
  BACKUP_KEY: string;
  OPS_TRIGGER_TOKEN: string;
}

const MAGIC = new TextEncoder().encode('KSA1');
const ALERT_COOLDOWN_MS = 30 * 60 * 1000;

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store'
    }
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function shouldAlert(env: Env): Promise<boolean> {
  const now = new Date().toISOString();
  try {
    const row = await env.DB.prepare("SELECT value FROM settings WHERE key = 'ops:last_alert_at'").first<{ value: string }>();
    if (row?.value && Date.now() - Date.parse(row.value) < ALERT_COOLDOWN_MS) return false;
    await env.DB.prepare(
      "INSERT INTO settings (key, value, updated_at) VALUES ('ops:last_alert_at', ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at"
    )
      .bind(now, now)
      .run();
    return true;
  } catch {
    return true;
  }
}

async function sendAlert(env: Env, status: number, detail: string): Promise<boolean> {
  if (!(await shouldAlert(env))) return false;
  if (!env.RESEND_API_KEY) return false;
  const stamp = new Date().toISOString();
  const safeDetail = detail.replace(/[<>&]/g, (ch) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[ch] || ch));
  const html = `<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;text-align:right;max-width:560px;margin:auto;padding:24px">
<h2 style="color:#b42318">تنبيه: تعذر الوصول إلى ksa.doctor</h2>
<p>فشل فحص <strong>https://ksa.doctor/api/health</strong> ثلاث مرات متتالية.</p>
<p>آخر رمز استجابة: <strong>${status || 'لا يوجد'}</strong></p>
<p style="color:#6b7c70;font-size:13px">${safeDetail.slice(0, 240)}</p>
<p>وقت الفحص: ${stamp}</p>
<p><a href="https://ksa.doctor/admin">فتح لوحة الإشراف</a></p>
</div>`;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.FROM_EMAIL,
      to: [env.ADMIN_EMAIL],
      subject: 'تنبيه عاجل: ksa.doctor غير متاح',
      html
    })
  });
  return res.ok;
}

async function checkHealth(env: Env): Promise<{ ok: boolean; status: number; alerted: boolean; detail: string }> {
  let status = 0;
  let detail = '';
  let ok = false;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(`${env.APP_URL}/api/health`, { cf: { cacheTtl: 0 } });
      status = res.status;
      const text = await res.text();
      if (res.ok && /"ok"\s*:\s*true/.test(text)) {
        ok = true;
        detail = 'healthy';
        break;
      }
      detail = text.slice(0, 240);
    } catch (err) {
      detail = String(err).slice(0, 240);
    }
    if (attempt < 3) await sleep(2000);
  }
  let alerted = false;
  if (!ok) alerted = await sendAlert(env, status, detail);
  return { ok, status, alerted, detail };
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value.trim());
  return Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
}

async function gzip(data: ArrayBuffer): Promise<Uint8Array> {
  const stream = new Blob([data]).stream().pipeThrough(new CompressionStream('gzip'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function encrypt(keyB64: string, plain: Uint8Array): Promise<Uint8Array> {
  const keyBytes = base64ToBytes(keyB64);
  if (keyBytes.length !== 32) throw new Error('BACKUP_KEY must decode to 32 bytes');
  const key = await crypto.subtle.importKey(
    'raw',
    keyBytes as unknown as BufferSource,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv as unknown as BufferSource },
      key,
      plain as unknown as BufferSource
    )
  );
  const out = new Uint8Array(MAGIC.length + iv.length + cipher.length);
  out.set(MAGIC, 0);
  out.set(iv, MAGIC.length);
  out.set(cipher, MAGIC.length + iv.length);
  return out;
}

async function backup(env: Env): Promise<{ ok: boolean; key?: string; bytes?: number; sourceBytes?: number; error?: string }> {
  try {
    if (!env.CF_API_TOKEN) throw new Error('CF_API_TOKEN is not configured');
    if (!env.BACKUP_KEY) throw new Error('BACKUP_KEY is not configured');
    const exportRes = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/d1/database/${env.D1_DATABASE_ID}/export`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${env.CF_API_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ output_format: 'file' })
      }
    );
    const exportJson = (await exportRes.json()) as { success?: boolean; result?: { signed_url?: string }; errors?: unknown };
    const signedUrl = exportJson.result?.signed_url;
    if (!exportRes.ok || !exportJson.success || !signedUrl) {
      throw new Error(`D1 export failed: HTTP ${exportRes.status}`);
    }
    const sqlRes = await fetch(signedUrl);
    if (!sqlRes.ok) throw new Error(`D1 download failed: HTTP ${sqlRes.status}`);
    const sql = await sqlRes.arrayBuffer();
    if (sql.byteLength < 100) throw new Error('D1 export is unexpectedly empty');
    const compressed = await gzip(sql);
    const encrypted = await encrypt(env.BACKUP_KEY, compressed);
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const key = `d1/ksa-doctor-${stamp}.sql.gz.enc`;
    await env.BACKUPS.put(key, encrypted, {
      httpMetadata: { contentType: 'application/octet-stream' },
      customMetadata: { source: 'ksa-doctor-db', format: 'sql.gz.aes-256-gcm.v1' }
    });
    try {
      const now = new Date().toISOString();
      await env.DB.prepare(
        "INSERT INTO settings (key, value, updated_at) VALUES ('ops:last_backup_at', ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at"
      )
        .bind(now, now)
        .run();
    } catch {
      // Backup is already safe in R2; state logging is best-effort.
    }
    return { ok: true, key, bytes: encrypted.byteLength, sourceBytes: sql.byteLength };
  } catch (err) {
    return { ok: false, error: String(err).slice(0, 240) };
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname !== '/run') return new Response('Not found', { status: 404 });
    const auth = request.headers.get('authorization') || '';
    if (!env.OPS_TRIGGER_TOKEN || auth !== `Bearer ${env.OPS_TRIGGER_TOKEN}`) return json({ error: 'unauthorized' }, 401);
    const job = url.searchParams.get('job') || 'health';
    if (job === 'health') return json(await checkHealth(env));
    if (job === 'backup') return json(await backup(env));
    if (job === 'alert') return json({ ok: true, alerted: await sendAlert(env, 503, 'Manual alert test') });
    return json({ error: 'unknown_job' }, 400);
  },

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    if (event.cron === '15 2 * * *') {
      ctx.waitUntil(backup(env));
    } else {
      ctx.waitUntil(checkHealth(env));
    }
  }
};
