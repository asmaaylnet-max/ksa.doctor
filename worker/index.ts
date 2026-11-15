import { Hono } from 'hono';
import type { AppEnv } from './env';
import { authRoutes, loadSession } from './auth';
import { profileRoutes } from './profile';
import { publicRoutes } from './public';
import { adminRoutes } from './admin';
import { robots, serveApp, sitemap } from './meta';
import { clientIp, jsonError, userAgent } from './util';

const app = new Hono<AppEnv>();

app.use('*', async (c, next) => {
  c.set('ip', clientIp(c));
  c.set('ua', userAgent(c));
  await next();
});

app.use('*', loadSession);

// Same-origin enforcement for state-changing API calls (CSRF defence in depth).
app.use('/api/*', async (c, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(c.req.method)) {
    const origin = c.req.header('Origin');
    const allowed = new Set([new URL(c.env.APP_URL).origin, new URL(c.req.url).origin]);
    if (origin && !allowed.has(origin)) return jsonError(c, 403, 'bad_origin', 'Request origin not allowed');
    const site = c.req.header('Sec-Fetch-Site');
    if (site && site !== 'same-origin' && site !== 'none') return jsonError(c, 403, 'bad_origin', 'Cross-site request blocked');
    const length = Number(c.req.header('Content-Length') || 0);
    if (length > 10 * 1024 * 1024) return jsonError(c, 413, 'too_large', 'Request is too large');
  }
  await next();
});

app.use('*', async (c, next) => {
  await next();
  const res = c.res;
  const headers = new Headers(res.headers);
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  headers.set('Cross-Origin-Resource-Policy', 'same-origin');
  headers.set('X-DNS-Prefetch-Control', 'off');
  if (new URL(c.req.url).protocol === 'https:') {
    headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  if (!headers.has('Content-Security-Policy')) {
    headers.set(
      'Content-Security-Policy',
      "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://i.ytimg.com; font-src 'self'; connect-src 'self'; frame-src https://www.youtube-nocookie.com; media-src 'self'; worker-src 'self'; manifest-src 'self'; upgrade-insecure-requests"
    );
  }
  if (c.req.path.startsWith('/api/')) headers.set('Cache-Control', 'no-store');
  c.res = new Response(res.body, { status: res.status, statusText: res.statusText, headers });
});

// www → apex
app.use('*', async (c, next) => {
  const host = new URL(c.req.url).hostname;
  if (host.startsWith('www.')) {
    const target = new URL(c.req.url);
    target.hostname = host.slice(4);
    return c.redirect(target.toString(), 301);
  }
  await next();
});

app.route('/api/auth', authRoutes);
app.route('/api/admin', adminRoutes);
app.route('/api', profileRoutes);
app.route('/api', publicRoutes);

app.get('/sitemap.xml', sitemap);
app.get('/robots.txt', (c) => robots(c.env.APP_URL));

app.get('/media/:key{.+}', async (c) => {
  const key = c.req.param('key');
  if (!/^\d+\/[a-z]+-[A-Za-z0-9_-]+\.(webp|jpg|jpeg|png)$/.test(key)) {
    return new Response('Not found', { status: 404 });
  }
  const ifNoneMatch = c.req.header('If-None-Match');
  const object = await c.env.MEDIA.get(key);
  if (!object) return new Response('Not found', { status: 404 });
  if (ifNoneMatch && object.httpEtag && ifNoneMatch === object.httpEtag) {
    return new Response(null, { status: 304, headers: { ETag: object.httpEtag } });
  }
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  headers.set('ETag', object.httpEtag);
  headers.set('Content-Disposition', 'inline');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Content-Length', String(object.size));
  return new Response(object.body, { status: 200, headers });
});

app.all('/api/*', (c) => jsonError(c, 404, 'not_found', 'Endpoint not found'));
app.get('*', serveApp);

app.notFound((c) => {
  if (c.req.path.startsWith('/api/')) return jsonError(c, 404, 'not_found', 'Endpoint not found');
  return serveApp(c);
});

app.onError((err, c) => {
  console.error('worker_error', err);
  if (c.req.path.startsWith('/api/')) return jsonError(c, 500, 'server_error', 'Something went wrong');
  return new Response('Something went wrong', { status: 500 });
});

export default app;
