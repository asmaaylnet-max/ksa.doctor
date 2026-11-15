import type { Env } from './env';

const BRAND = '#006830';
const GOLD = '#c8a45c';

function shell(title: string, body: string, dir: 'rtl' | 'ltr' = 'rtl'): string {
  const align = dir === 'rtl' ? 'right' : 'left';
  return `<!doctype html><html dir="${dir}" lang="${dir === 'rtl' ? 'ar' : 'en'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f4f6f2;font-family:Tahoma,Arial,sans-serif;color:#122018;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f6f2;padding:28px 12px;"><tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:580px;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #e4ebe4;">
<tr><td style="background:linear-gradient(135deg,#006830,#004a24);padding:26px 28px;text-align:center;">
<div style="font-size:22px;font-weight:bold;color:#ffffff;letter-spacing:.2px;">أطباء المملكة العربية السعودية</div>
<div style="font-size:12px;color:#d9f3e3;margin-top:6px;">رأس مال بشري سعودي نفخر به</div>
</td></tr>
<tr><td style="padding:30px 28px;text-align:${align};line-height:1.9;font-size:15px;">${body}</td></tr>
<tr><td style="padding:18px 28px;background:#f8faf7;text-align:center;font-size:12px;color:#6b7c70;border-top:1px solid #eef2ec;">
<a href="https://ksa.doctor" style="color:${BRAND};text-decoration:none;font-weight:bold;">ksa.doctor</a> · منصة الملفات المهنية للأطباء في المملكة
<div style="margin-top:6px;color:#9aa99f;">هذه رسالة آلية من منصة أطباء المملكة. لا تشارك رابط إعادة التعيين مع أي شخص.</div>
</td></tr></table></td></tr></table></body></html>`;
}

function button(href: string, label: string): string {
  return `<div style="text-align:center;margin:24px 0 8px;"><a href="${href}" style="display:inline-block;background:${BRAND};color:#ffffff;text-decoration:none;padding:13px 28px;border-radius:999px;font-weight:bold;font-size:15px;">${label}</a></div>`;
}

export interface EmailPayload {
  to: string;
  template: string;
  subject: string;
  html: string;
}

export function welcomeEmail(name: string, handle: string, appUrl: string): EmailPayload['html'] {
  return shell(
    'مرحبًا بك في أطباء المملكة',
    `<p>مرحبًا <strong>${escapeHtml(name)}</strong>،</p>
<p>تم إنشاء حسابك في منصة <strong>أطباء المملكة العربية السعودية</strong> بنجاح.</p>
<p>رابطك المهني المحجوز: <a href="${appUrl}/${handle}" style="color:${BRAND};font-weight:bold;">${appUrl}/${handle}</a></p>
<p>أكمل ملفك المهني وأضف صور مهاراتك وأعمالك وروابطك ليظهر بأبهى صورة بعد اعتماد المشرف الرئيسي.</p>
${button(`${appUrl}/dashboard`, 'أكمل ملفي المهني')}
<p style="color:#6b7c70;font-size:13px;">ملاحظة: يظهر ملفك للزوار بعد اعتماد الإدارة، ويمكنك تعديله في أي وقت.</p>`
  );
}

export function approvedEmail(name: string, handle: string, appUrl: string): EmailPayload['html'] {
  return shell(
    'تم اعتماد ملفك',
    `<p>مرحبًا <strong>${escapeHtml(name)}</strong>،</p>
<p>يسعدنا إبلاغك بأنه تم <strong style="color:${BRAND}">اعتماد ملفك المهني</strong> ونشره على المنصة.</p>
<p>شارك رابطك مع مرضاك وزملائك:</p>
${button(`${appUrl}/${handle}`, 'عرض ملفي المنشور')}
<p style="color:#6b7c70;font-size:13px;">يمكنك تنزيل رمز QR وبطاقة vCard والملف التعريفي من لوحة التحكم.</p>`
  );
}

export function rejectedEmail(name: string, reason: string, appUrl: string): EmailPayload['html'] {
  return shell(
    'ملاحظات على ملفك',
    `<p>مرحبًا <strong>${escapeHtml(name)}</strong>،</p>
<p>راجع فريق الإشراف ملفك المهني، ونحتاج إلى بعض التعديلات قبل اعتماده.</p>
<div style="background:#fff8e8;border:1px solid #f0dca8;border-radius:12px;padding:14px 16px;margin:16px 0;color:#6b5420;">${escapeHtml(reason)}</div>
<p>يمكنك تعديل ملفك وإعادة إرساله للمراجعة في أي وقت.</p>
${button(`${appUrl}/dashboard`, 'تعديل الملف وإعادة الإرسال')}`
  );
}

export function suspendedEmail(name: string, appUrl: string): EmailPayload['html'] {
  return shell(
    'تم إيقاف نشر الملف مؤقتًا',
    `<p>مرحبًا <strong>${escapeHtml(name)}</strong>،</p>
<p>تم إيقاف نشر ملفك مؤقتًا من قبل الإدارة. للاستفسار يرجى التواصل مع فريق المنصة.</p>
${button(`${appUrl}/dashboard`, 'الدخول إلى حسابي')}`
  );
}

export function resetEmail(name: string, link: string): EmailPayload['html'] {
  return shell(
    'إعادة تعيين كلمة المرور',
    `<p>مرحبًا <strong>${escapeHtml(name)}</strong>،</p>
<p>وصلنا طلب لإعادة تعيين كلمة المرور لحسابك. الرابط صالح لمدة <strong>60 دقيقة</strong>.</p>
${button(link, 'إعادة تعيين كلمة المرور')}
<p style="color:#6b7c70;font-size:13px;">إذا لم تطلب ذلك، يمكنك تجاهل الرسالة؛ لن يتم تغيير كلمة المرور.</p>`
  );
}

export function adminNewMemberEmail(name: string, email: string, handle: string, appUrl: string): EmailPayload['html'] {
  return shell(
    'عضو جديد بانتظار المراجعة',
    `<p>وصل عضو جديد إلى منصة أطباء المملكة.</p>
<table style="width:100%;border-collapse:collapse;font-size:14px;">
<tr><td style="padding:8px;border-bottom:1px solid #eef2ec;color:#6b7c70;">الاسم</td><td style="padding:8px;border-bottom:1px solid #eef2ec;font-weight:bold;">${escapeHtml(name)}</td></tr>
<tr><td style="padding:8px;border-bottom:1px solid #eef2ec;color:#6b7c70;">البريد</td><td style="padding:8px;border-bottom:1px solid #eef2ec;">${escapeHtml(email)}</td></tr>
<tr><td style="padding:8px;border-bottom:1px solid #eef2ec;color:#6b7c70;">الرابط</td><td style="padding:8px;border-bottom:1px solid #eef2ec;">${appUrl}/${escapeHtml(handle)}</td></tr>
</table>
${button(`${appUrl}/admin`, 'مراجعة الأعضاء')}`
  );
}

export function testEmail(): EmailPayload['html'] {
  return shell('اختبار البريد', `<p>تم ربط Resend بنجاح، وهذه رسالة اختبار من منصة أطباء المملكة.</p><p style="color:#6b7c70;font-size:13px;">التاريخ: ${new Date().toISOString()}</p>`);
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] || ch));
}

export async function queueEmail(env: Env, payload: EmailPayload): Promise<number | null> {
  try {
    const result = await env.DB.prepare(
      'INSERT INTO email_outbox (to_email, template, subject, html, status) VALUES (?, ?, ?, ?, ?)'
    )
      .bind(payload.to, payload.template, payload.subject, payload.html, env.RESEND_API_KEY ? 'queued' : 'skipped')
      .run();
    const id = Number(result.meta.last_row_id || 0);
    return id || null;
  } catch {
    return null;
  }
}

export async function dispatchEmail(env: Env, id: number): Promise<{ ok: boolean; error?: string }> {
  const row = await env.DB.prepare('SELECT id, to_email, subject, html, status FROM email_outbox WHERE id = ?')
    .bind(id)
    .first<{ id: number; to_email: string; subject: string; html: string; status: string }>();
  if (!row || row.status === 'sent') return { ok: true };
  if (!env.RESEND_API_KEY) return { ok: false, error: 'missing_api_key' };

  let lastError = '';
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: env.FROM_EMAIL,
          to: [row.to_email],
          subject: row.subject,
          html: row.html
        })
      });
      if (res.ok) {
        await env.DB.prepare("UPDATE email_outbox SET status = 'sent', sent_at = ?, error = '' WHERE id = ?")
          .bind(new Date().toISOString(), id)
          .run();
        return { ok: true };
      }
      lastError = `HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`;
      if (res.status < 500 && res.status !== 429) break;
    } catch (err) {
      lastError = String(err).slice(0, 300);
    }
    if (attempt === 0) await new Promise((r) => setTimeout(r, 800));
  }
  await env.DB.prepare("UPDATE email_outbox SET status = 'failed', error = ? WHERE id = ?")
    .bind(lastError, id)
    .run();
  return { ok: false, error: lastError };
}

export async function sendOrQueue(env: Env, payload: EmailPayload): Promise<void> {
  const id = await queueEmail(env, payload);
  if (id && env.RESEND_API_KEY) {
    await dispatchEmail(env, id);
  }
}

export const EMAIL_SUBJECTS = {
  welcome: 'مرحبًا بك في أطباء المملكة العربية السعودية',
  approved: 'تم اعتماد ملفك في أطباء المملكة',
  rejected: 'ملاحظات على ملفك في أطباء المملكة',
  suspended: 'تم إيقاف نشر ملفك مؤقتًا',
  reset: 'إعادة تعيين كلمة المرور — أطباء المملكة',
  adminNew: 'عضو جديد بانتظار المراجعة — أطباء المملكة',
  test: 'اختبار البريد — أطباء المملكة'
};
