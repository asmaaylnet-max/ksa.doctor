# أطباء المملكة العربية السعودية · KSA Doctors

منصة الملفات المهنية للأطباء في المملكة، برابط قصير لكل طبيب: **ksa.doctor/name**.

> **رأس مال بشري سعودي نفخر به**

## الحالة

- **مباشر:** [https://ksa.doctor](https://ksa.doctor)
- **GitHub:** [asmaaylnet-max/ksa.doctor](https://github.com/asmaaylnet-max/ksa.doctor)
- **الإصدار:** جاهز للتجربة البشرية المحدودة (Amber) — البريد بانتظار مفتاح Resend.
- **تقرير الجاهزية:** [`docs/LAUNCH_READINESS.md`](docs/LAUNCH_READINESS.md)

## أبرز القدرات

- ملف مهني عربي/إنجليزي فاخر مع غلاف وصورة افتراضية، نبذة، تخصص، مدينة، خدمات، أزرار مخصصة، فيديوهات YouTube، روابط تواصل، صور إثبات مهارة ونماذج أعمال.
- بحث فوري بالاسم أو التخصص أو المدينة، مع فلاتر التخصص والمدينة.
- لوحة مستخدم كاملة: تعديل الملف، الوسائط، الروابط، QR وvCard، بطاقة مشاركة، PDF، الإعدادات، تصدير البيانات.
- لوحة إشراف: إحصاءات، اعتماد/رفض/إيقاف/استعادة، تمييز، إظهار/إخفاء، سجل نشاط، سجل بريد، CSV.
- مصادقة آمنة: PBKDF2-SHA256 في المتصفح (310,000 دورة)، تخزين hash مع pepper، جلسات httpOnly، حدود معدل، حماية Origin/CSRF، CSP وHSTS.
- PWA: مانيفست وService Worker ورسالة تثبيت وتحديث، مع تجربة offline.
- عربي افتراضي وRTL، دعم إنجليزي كامل، وضع داكن/فاتح، خط Tajawal محلي.
- SEO: meta لكل ملف، Open Graph، JSON-LD Physician/WebSite، sitemap، robots، noindex للوحات الخاصة.

## التقنية

React 18 · Vite 6 · TypeScript · Tailwind CSS 3.4 · React Router 6 · Hono · Cloudflare Workers · D1 · R2 · vite-plugin-pwa · Resend.

```
src/        الواجهة (صفحات، مكونات، i18n، مكتبات)
worker/     Worker API (Hono، مصادقة، ملفات، بحث، إشراف، بريد، SEO)
shared/     الأنواع والمخططات والبيانات المشتركة
migrations/ مخطط D1
public/     الأصول والهوية البصرية
docs/       تقارير البناء والجاهزية ولقطات QA
```

## التشغيل المحلي

```bash
npm install
cp .dev.vars.example .dev.vars   # املأ القيم محليًا
npm run build
npx wrangler dev
```

## الأوامر

```bash
npx tsc --noEmit                 # فحص الأنواع
npm run build                    # بناء الإنتاج + PWA
npx wrangler deploy              # نشر Worker على ksa.doctor
npx wrangler tail                # متابعة السجلات
npx wrangler d1 migrations apply ksa-doctor-db --remote
```

## الأسرار

لا تُرفع إلى Git. تُضبط عبر Wrangler:

```bash
npx wrangler secret put SESSION_SECRET
npx wrangler secret put PASSWORD_PEPPER
npx wrangler secret put RESEND_API_KEY
```

`.gitignore` يستثني `.secrets/` و`CREDENTIALS.txt` و`.dev.vars` و`node_modules/` و`dist/`.

## الترخيص

حقوق النشر محفوظة لمالك المنصة. لا يُسمح بإعادة النشر التجاري دون إذن.
