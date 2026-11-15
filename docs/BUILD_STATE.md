# KSA.DOCTOR — Build State (internal)

Updated: 2026-11-15 (final pilot-ready state)

## Live resources

- Live URL: https://ksa.doctor (custom domain + www 301 → apex)
- Cloudflare account: `9832075498101f6bbff93a4499a9a56b`
- Zone: `ksa.doctor` ID `41dd08a9583bd9a0a8ce9e46b619d66a`, active.
- Worker: `ksa-doctor`; config `wrangler.jsonc`; latest deployment version `049080fb-8a40-470f-8b2d-d21fdc55eac6`.
- D1: `ksa-doctor-db` ID `7a35e891-1670-47bc-bc45-a2c9cbcb55f2`, region WEUR.
- R2: `ksa-doctor-media`.
- GitHub: https://github.com/asmaaylnet-max/ksa.doctor — branch `main`, public.
- Current production data: 1 admin user (`admin@ksa.doctor`, C000001, `adminksa`, visible=0), 0 public members, 0 outbox, 0 audit, 0 analytics after QA cleanup.

## Resend / DNS

- DNS records confirmed:
  - `resend._domainkey.ksa.doctor` TXT (DKIM).
  - `send.ksa.doctor` CNAME `send.forge.rmta.net`.
  - `rsend.ksa.doctor` CNAME `rsend-apne1.forge.rmta.net`.
- No DMARC TXT yet; recommended.
- Resend connector API key is INVALID. `RESEND_API_KEY` is NOT configured on the Worker. Emails remain skipped/queued until a valid key is added.
- Required: reconnect Resend connector or supply a valid API key, then `npx wrangler secret put RESEND_API_KEY`, then send a test email from Admin → Email log.

## Product / architecture

- React 18 + Vite 6 + TypeScript + Tailwind 3.4 + React Router 6 + Hono on Cloudflare Workers + D1 + R2 + vite-plugin-pwa + Resend.
- Arabic-first default (`initialLang` returns `ar` unless `?lang=en` or stored preference); full English dictionary, dark/light theme, Tajawal local font.
- Auth: browser PBKDF2-SHA256 310k, email-bound salt → server `SHA-256(proof + PASSWORD_PEPPER)`. Session token hashed in D1; httpOnly SameSite=Lax cookie 30d.
- Member ID: `C` + zero-padded 6-digit D1 id. Handles `^[a-z0-9]{3,24}$`.
- Roles/status: member/admin; pending/approved/rejected/suspended. Public only approved + visible. Admin is hidden from public/search/sitemap.
- Media: avatar/cover/4 skills/4 works; client WebP compression; R2 keys `${userId}/${kind}-...`; served through Worker `/media/*` with immutable cache.
- SEO: profile-specific meta/OG/Physician JSON-LD with CSP nonce; sitemap; robots; noindex for private routes.
- PWA: manifest served as `application/manifest+json`; SW active at scope `/`; install/update prompts. Fixed long-extension asset routing (`{1,12}`) in `worker/meta.ts`.
- Security headers: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, COOP/CORP.
- www redirect 301 to apex.

## Verification completed

- `npx tsc --noEmit` passes.
- `npm run build` passes; PWA 78 precache entries (~1.38 MB).
- Final Playwright E2E: register → admin approve → profile update → links update → public profile; **0 console/page errors**.
- Temporary QA user `qadoctor` removed; all QA analytics/audit/outbox/rate-limit rows cleared; user sequence reset to 1.
- `/api/health` returns ok; `/api/meta` members=0; `/api/search` returns 200 empty; `/manifest.webmanifest` 200; SW active; sitemap/robots correct; www 301.
- QA screenshots in `docs/qa/`.

## Open items

1. Resend API key invalid — email flows blocked.
2. DMARC record absent.
3. D1 WEUR and free plan — evaluate after pilot.
4. Single admin account, no 2FA yet.
5. No external uptime monitor or scheduled D1 backup yet.
6. Legal pages need Saudi legal review before public launch.
7. Wrangler 3.114.17; plan v4 upgrade after pilot.

## Key files

- `worker/index.ts`, `worker/auth.ts`, `worker/profile.ts`, `worker/public.ts`, `worker/admin.ts`, `worker/meta.ts`, `worker/email.ts`, `worker/users.ts`, `worker/util.ts`.
- `shared/types.ts`, `shared/data.ts`, `shared/schemas.ts`, `shared/auth.ts`.
- `src/App.tsx`, `src/i18n/*`, `src/lib/*`, `src/components/*`, `src/pages/*`, `src/pages/dashboard/*`.
- `migrations/0001_init.sql`, `wrangler.jsonc`, `vite.config.ts`.
- `docs/LAUNCH_READINESS.md` — pilot readiness report.
- `CREDENTIALS.txt` (ignored by Git), `.secrets/admin.env` (ignored by Git).
