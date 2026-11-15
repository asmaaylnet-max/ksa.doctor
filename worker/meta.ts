import type { Context } from 'hono';
import type { AppEnv } from './env';
import { CITY_MAP } from '../shared/data';
import { randomToken } from '../shared/auth';
import { getUserByHandle, toPublic } from './users';
import type { UserPublic } from '../shared/types';

const PRIVATE_PREFIXES = ['/dashboard', '/admin', '/login', '/join', '/forgot', '/reset'];

function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function absolute(appUrl: string, key: string, fallback: string): string {
  if (!key) return fallback;
  return `${appUrl}/media/${key}`;
}

function stripMeta(html: string, key: string): string {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`<meta\\s+(?:property|name)=["']${escaped}["'][^>]*>\\s*`, 'gi');
  return html.replace(re, '');
}

function upsertMeta(html: string, attr: 'property' | 'name', key: string, content: string): string {
  const tag = `<meta ${attr}="${key}" content="${esc(content)}" />`;
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`<meta\\s+${attr}=["']${escaped}["'][^>]*>`, 'i');
  if (re.test(html)) return html.replace(re, tag);
  return html.replace('</head>', `  ${tag}\n</head>`);
}

function upsertCanonical(html: string, url: string): string {
  const tag = `<link rel="canonical" href="${esc(url)}" />`;
  if (/<link\s+rel=["']canonical["'][^>]*>/i.test(html)) {
    return html.replace(/<link\s+rel=["']canonical["'][^>]*>/i, tag);
  }
  return html.replace('</head>', `  ${tag}\n</head>`);
}

function profileHead(profile: UserPublic, appUrl: string): string {
  const name = profile.fullNameAr || profile.fullNameEn || profile.handle;
  const specialty = profile.specialtyAr || profile.specialtyEn || 'طبيب';
  const city = profile.city && CITY_MAP[profile.city] ? CITY_MAP[profile.city].ar : '';
  const title = `${name} — ${specialty}${city ? ` | ${city}` : ''} | أطباء المملكة`;
  const description =
    (profile.bioAr || profile.bioEn || `${specialty}${city ? ` في ${city}` : ''} — ملف مهني موثوق على منصة أطباء المملكة العربية السعودية.`).slice(0, 180);
  const image = absolute(appUrl, profile.coverKey || profile.avatarKey, `${appUrl}/brand/og-default.jpg`);
  const canonical = `${appUrl}/${profile.handle}`;
  return `
    <meta name="description" content="${esc(description)}" />
    <meta property="og:type" content="profile" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(description)}" />
    <meta property="og:image" content="${esc(image)}" />
    <meta property="og:image:alt" content="${esc(`${name} — ${specialty}`)}" />
    <meta property="og:url" content="${esc(canonical)}" />
    <meta property="profile:first_name" content="${esc(name.split(' ')[0] || name)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(title)}" />
    <meta name="twitter:description" content="${esc(description)}" />
    <meta name="twitter:image" content="${esc(image)}" />
    <link rel="canonical" href="${esc(canonical)}" />
  `;
}

function physicianJsonLd(profile: UserPublic, appUrl: string): string {
  const city = profile.city && CITY_MAP[profile.city] ? CITY_MAP[profile.city].ar : '';
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Physician',
    name: profile.fullNameAr || profile.fullNameEn || profile.handle,
    alternateName: profile.fullNameEn || undefined,
    medicalSpecialty: profile.specialtyAr || profile.specialtyEn || undefined,
    description: (profile.bioAr || profile.bioEn || '').slice(0, 500) || undefined,
    url: `${appUrl}/${profile.handle}`,
    image: absolute(appUrl, profile.avatarKey || profile.coverKey, `${appUrl}/brand/og-default.jpg`),
    telephone: profile.phone || profile.whatsapp || undefined,
    email: profile.publicEmail || undefined,
    address: city ? { '@type': 'PostalAddress', addressLocality: city, addressCountry: 'SA' } : undefined,
    memberOf: { '@type': 'Organization', name: 'أطباء المملكة العربية السعودية', url: appUrl }
  };
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

function websiteJsonLd(appUrl: string): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'أطباء المملكة العربية السعودية',
    alternateName: 'KSA Doctor',
    url: appUrl,
    inLanguage: ['ar', 'en'],
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${appUrl}/search?q={search_term_string}` },
      'query-input': 'required name=search_term_string'
    }
  }).replace(/</g, '\\u003c');
}

export async function serveApp(c: Context<AppEnv>): Promise<Response> {
  const url = new URL(c.req.url);
  const path = url.pathname;
  const appUrl = c.env.APP_URL.replace(/\/$/, '');

  if (/\.[a-z0-9]{1,8}$/i.test(path) || path.startsWith('/assets/') || path.startsWith('/brand/') || path.startsWith('/fonts/')) {
    return c.env.ASSETS.fetch(c.req.raw);
  }

  const assetRes = await c.env.ASSETS.fetch(new Request(new URL('/index.html', url).toString(), { method: 'GET' }));
  if (!assetRes.ok) return new Response('Service temporarily unavailable', { status: 503 });
  let html = await assetRes.text();
  const nonce = randomToken(16);
  const isPrivate = PRIVATE_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
  let isProfile = false;

  if (/^\/[a-z0-9]{3,24}$/.test(path)) {
    const handle = path.slice(1).toLowerCase();
    const row = await getUserByHandle(c.env, handle);
    if (row && row.status === 'approved' && row.visible) {
      isProfile = true;
      const profile = toPublic(row);
      const head = profileHead(profile, appUrl);
      html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${esc(`${profile.fullNameAr || profile.handle} — ${profile.specialtyAr || 'طبيب'} | أطباء المملكة`)}</title>`);
      for (const key of ['description', 'og:title', 'og:description', 'og:image', 'og:url', 'twitter:title', 'twitter:description', 'twitter:image']) {
        html = stripMeta(html, key);
      }
      html = html.replace('</head>', `${head}\n<script type="application/ld+json" nonce="${nonce}">${physicianJsonLd(profile, appUrl)}</script>\n</head>`);
    } else if (row) {
      html = html.replace('</head>', '<meta name="robots" content="noindex" />\n</head>');
    }
  }

  if (path === '/') {
    html = html.replace('</head>', `<script type="application/ld+json" nonce="${nonce}">${websiteJsonLd(appUrl)}</script>\n</head>`);
  }

  if (isPrivate && !isProfile) {
    html = html.replace('</head>', '<meta name="robots" content="noindex, nofollow" />\n</head>');
  }

  const headers = new Headers({
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-cache, must-revalidate',
    'Content-Security-Policy': `default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self' 'nonce-${nonce}'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://i.ytimg.com; font-src 'self'; connect-src 'self'; frame-src https://www.youtube-nocookie.com; media-src 'self'; worker-src 'self'; manifest-src 'self'; upgrade-insecure-requests`
  });
  if (isPrivate) headers.set('X-Robots-Tag', 'noindex, nofollow');
  return new Response(html, { status: 200, headers });
}

export async function sitemap(c: Context<AppEnv>): Promise<Response> {
  const appUrl = c.env.APP_URL.replace(/\/$/, '');
  const { results } = await c.env.DB.prepare(
    "SELECT handle, updated_at FROM users WHERE status = 'approved' AND visible = 1 ORDER BY updated_at DESC"
  ).all<{ handle: string; updated_at: string }>();
  const urls = [
    `<url><loc>${appUrl}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>`,
    `<url><loc>${appUrl}/search</loc><changefreq>daily</changefreq><priority>0.8</priority></url>`,
    ...(results || []).map(
      (r) => `<url><loc>${appUrl}/${encodeURIComponent(r.handle)}</loc><lastmod>${r.updated_at.slice(0, 10)}</lastmod><changefreq>weekly</changefreq><priority>0.9</priority></url>`
    )
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;
  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=600' }
  });
}

export function robots(appUrl: string): Response {
  const body = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /dashboard
Disallow: /admin
Disallow: /login
Disallow: /join
Disallow: /reset
Disallow: /forgot
Sitemap: ${appUrl.replace(/\/$/, '')}/sitemap.xml
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=86400' } });
}
