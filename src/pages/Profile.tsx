import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  Check,
  Copy,
  Download,
  Eye,
  Globe2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Printer,
  QrCode,
  Share2,
  ShieldCheck,
  Sparkles,
  Star
} from 'lucide-react';
import type { MediaItem, UserPublic, UserStatus } from '../../shared/types';
import { CITY_MAP, socialHref } from '../../shared/data';
import { api, ApiError } from '../lib/api';
import { useI18n } from '../i18n';
import { avatarUrl, coverUrl } from '../lib/media';
import { absoluteUrl, copyText, shareUrl } from '../lib/format';
import { buildVCard, downloadVCard } from '../lib/vcard';
import { downloadCanvas, downloadQrSvg, makeBrandedQr, qrDataUrl } from '../lib/qr';
import { getIcon } from '../lib/icons';
import { useToast } from '../lib/toast';
import { SocialIcon } from '../components/SocialIcons';
import { YouTubeEmbed } from '../components/YouTubeEmbed';
import { ImageLightbox } from '../components/ImageLightbox';
import { Modal } from '../components/Modal';
import { EmptyState } from '../components/EmptyState';

interface ProfileResponse {
  state: UserStatus | 'approved';
  profile?: UserPublic;
  preview?: boolean;
  handle?: string;
}

function ExternalAction({ href, children, className = '', style }: { href: string; children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <a href={href} target={href.startsWith('mailto:') || href.startsWith('tel:') ? undefined : '_blank'} rel="noopener noreferrer" className={className} style={style}>
      {children}
    </a>
  );
}

export default function Profile() {
  const { handle = '' } = useParams();
  const { t, lang, pick, formatNumber, formatDate } = useI18n();
  const { toast } = useToast();
  const [data, setData] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [errorCode, setErrorCode] = useState('');
  const [shareOpen, setShareOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [siteQr, setSiteQr] = useState('');
  const [vcardQr, setVcardQr] = useState('');
  const [lightbox, setLightbox] = useState<{ items: MediaItem[]; index: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    setData(null);
    api<ProfileResponse>(`/public/${encodeURIComponent(handle)}`)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled) {
          setNotFound(true);
          setErrorCode(err instanceof ApiError ? err.code : 'profile_not_found');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [handle]);

  const profile = data?.profile;
  const name = profile ? pick(profile.fullNameAr, profile.fullNameEn) : '';
  const specialty = profile ? pick(profile.specialtyAr, profile.specialtyEn) : '';
  const siteUrl = profile ? absoluteUrl(`/${profile.handle}`) : '';

  useEffect(() => {
    if (!profile) return;
    const description = pick(profile.bioAr, profile.bioEn).slice(0, 160) || specialty;
    document.title = `${name} — ${specialty} | ${t('app.name')}`;
    const setMeta = (selector: string, attr: string, value: string) => {
      let el = document.head.querySelector(selector) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        if (selector.includes('property')) el.setAttribute('property', selector.split('"')[1]);
        else el.setAttribute('name', selector.split('"')[1]);
        document.head.appendChild(el);
      }
      el.setAttribute(attr, value);
    };
    setMeta('meta[name="description"]', 'content', description);
    setMeta('meta[property="og:title"]', 'content', `${name} — ${specialty}`);
    setMeta('meta[property="og:description"]', 'content', description);
    setMeta('meta[property="og:image"]', 'content', absoluteUrl(coverUrl(profile.coverKey)));
    let canonical = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = siteUrl;
  }, [profile, name, specialty, siteUrl, t]);

  useEffect(() => {
    if (!qrOpen || !profile) return;
    qrDataUrl(siteUrl, 512).then(setSiteQr).catch(() => setSiteQr(''));
    qrDataUrl(buildVCard(profile), 512).then(setVcardQr).catch(() => setVcardQr(''));
  }, [qrOpen, profile, siteUrl]);

  const shareText = useMemo(() => {
    if (!profile) return '';
    return t('prof.shareText', { name, specialty });
  }, [profile, name, specialty, t]);

  if (loading) {
    return (
      <div className="container-page py-10">
        <div className="skeleton h-[260px] w-full !rounded-[28px]" />
        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4"><div className="skeleton h-56" /><div className="skeleton h-72" /></div>
          <div className="space-y-4"><div className="skeleton h-64" /><div className="skeleton h-48" /></div>
        </div>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="container-page py-16">
        <EmptyState
          icon={ShieldCheck}
          title={data?.state === 'pending' ? t('prof.pendingTitle') : errorCode === 'profile_unavailable' ? t('prof.unavailableTitle') : t('prof.notFoundTitle')}
          body={data?.state === 'pending' ? t('prof.pendingBody') : errorCode === 'profile_unavailable' ? t('prof.unavailableBody') : t('prof.notFoundBody')}
          action={<Link to="/search" className="btn btn-primary">{t('prof.backToSearch')}</Link>}
        />
      </div>
    );
  }

  const city = CITY_MAP[profile.city] ? (lang === 'ar' ? CITY_MAP[profile.city].ar : CITY_MAP[profile.city].en) : '';
  const previewNotice = data?.preview
    ? data.state === 'pending'
      ? t('prof.pendingBody')
      : data.state === 'rejected'
        ? t('dash.rejectedBody')
        : t('dash.suspendedBody')
    : '';
  const websiteHref = profile.website ? (/^https?:\/\//i.test(profile.website) ? profile.website : `https://${profile.website}`) : '';
  const waHref = profile.whatsapp ? `https://wa.me/${profile.whatsapp.replace(/[^\d]/g, '')}` : '';
  const accentStyle = { '--pa': profile.accent || '#006830' } as React.CSSProperties;

  const copy = async () => {
    const ok = await copyText(siteUrl);
    toast(ok ? t('prof.copied') : t('common.error'));
  };

  const nativeShare = async () => {
    const result = await shareUrl({ title: name, text: shareText, url: siteUrl });
    if (result === 'copied') toast(t('prof.copied'));
    if (result === 'failed') setShareOpen(true);
  };

  const downloadSitePng = async () => {
    const canvas = await makeBrandedQr(siteUrl, name, `${specialty}${city ? ` · ${city}` : ''}`, lang);
    downloadCanvas(canvas, `${profile.handle}-qr.png`);
  };

  const downloadVcardPng = async () => {
    const canvas = await makeBrandedQr(buildVCard(profile), `${name} — vCard`, t('prof.downloadVcard'), lang);
    downloadCanvas(canvas, `${profile.handle}-vcard-qr.png`);
  };

  const shareLinks = [
    { key: 'whatsapp', href: `https://wa.me/?text=${encodeURIComponent(`${shareText} ${siteUrl}`)}`, color: '#25d366', Icon: MessageCircle },
    { key: 'x', href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(siteUrl)}`, color: '#111', Icon: Share2 },
    { key: 'linkedin', href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(siteUrl)}`, color: '#0a66c2', Icon: Globe2 },
    { key: 'telegram', href: `https://t.me/share/url?url=${encodeURIComponent(siteUrl)}&text=${encodeURIComponent(shareText)}`, color: '#229ed9', Icon: Share2 },
    { key: 'facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(siteUrl)}`, color: '#1877f2', Icon: Share2 },
    { key: 'email', href: `mailto:?subject=${encodeURIComponent(name)}&body=${encodeURIComponent(`${shareText} ${siteUrl}`)}`, color: '#6b7280', Icon: Mail }
  ] as const;

  return (
    <div style={accentStyle}>
      {previewNotice && (
        <div className="border-b px-4 py-2.5 text-center text-xs font-bold" style={{ borderColor: 'var(--gold)', background: 'var(--gold-soft)', color: 'var(--text)' }}>
          {t('prof.preview')} · {previewNotice}
        </div>
      )}

      <div className="relative">
        <div className="relative h-[230px] overflow-hidden sm:h-[330px]">
          {profile.coverKey ? (
            <img src={coverUrl(profile.coverKey)} alt="" className="h-full w-full object-cover object-center" fetchPriority="high" />
          ) : (
            <div className="relative h-full w-full overflow-hidden" style={{ background: 'linear-gradient(120deg,#022c1c 0%,#075c3b 58%,#043824 100%)' }}>
              <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'radial-gradient(circle at 18% 22%, rgba(200,164,92,.45), transparent 42%), radial-gradient(circle at 88% 90%, rgba(0,104,48,.55), transparent 50%)' }} />
              <div className="absolute -start-24 top-1/2 h-[420px] w-[420px] -translate-y-1/2 rounded-full border border-white/10 sm:h-[560px] sm:w-[560px]" />
              <div className="absolute -start-10 top-1/2 h-[260px] w-[260px] -translate-y-1/2 rounded-full border border-white/10 sm:h-[360px] sm:w-[360px]" />
              <div className="relative z-10 mx-auto flex h-full max-w-5xl items-center justify-center gap-3.5 px-5 pb-14 sm:gap-7 sm:px-10 sm:pb-16">
                <span className="grid h-[62px] w-[62px] shrink-0 place-items-center rounded-full border border-[#c8a45c]/70 bg-[#f8f4e9] shadow-2xl sm:h-28 sm:w-28 sm:border-2">
                  <img src="/brand/emblem.png" alt="" className="h-[52px] w-[52px] object-contain sm:h-24 sm:w-24" />
                </span>
                <div className="min-w-0 text-start">
                  <p className="text-[10px] font-bold tracking-wide text-[#e7d3a4] sm:text-sm">{t('app.name')}</p>
                  <p className="mt-1 text-[19px] font-extrabold leading-tight text-white sm:text-4xl">
                    {t('home.slogan').split(' ').slice(0, 2).join(' ')}{' '}
                    <span style={{ color: '#e7d3a4' }}>{t('home.slogan').split(' ').slice(2).join(' ')}</span>
                  </p>
                  <p className="mt-1.5 text-[9px] font-bold tracking-[0.32em] text-white/45 sm:mt-2 sm:text-xs">KSA.DOCTOR</p>
                </div>
              </div>
            </div>
          )}
          <div className="pointer-events-none absolute inset-0" style={{ background: 'linear-gradient(180deg,rgba(2,20,12,.08) 0%,rgba(2,20,12,.18) 55%,var(--bg) 100%)' }} />
          <div className="pointer-events-none absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(200,164,92,.55), transparent 45%)' }} />
        </div>

        <div className="container-page relative -mt-20 sm:-mt-24">
          <div className="card overflow-hidden p-5 sm:p-7">
            <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:items-end sm:text-start">
              <div className="relative -mt-16 shrink-0 sm:-mt-20">
                <span className="absolute -inset-1.5 rounded-[32px]" style={{ background: 'linear-gradient(135deg,var(--gold),var(--pa),var(--gold))' }} />
                <img src={avatarUrl(profile.avatarKey)} alt={name} className="relative h-28 w-28 rounded-[28px] border-4 object-cover sm:h-36 sm:w-36" style={{ borderColor: 'var(--surface)' }} />
                <span className="absolute -bottom-2 -end-2 grid h-9 w-9 place-items-center rounded-full border-2 bg-[var(--surface)]" style={{ borderColor: 'var(--surface)' }}>
                  <BadgeCheck size={24} style={{ color: 'var(--pa)' }} />
                </span>
              </div>

              <div className="min-w-0 flex-1 pb-1">
                <div className="mb-2 flex flex-wrap items-center justify-center gap-1.5 sm:justify-start">
                  <span className="badge badge-ok"><BadgeCheck size={12} /> {t('prof.verified')}</span>
                  {profile.featured && <span className="badge badge-gold"><Star size={11} /> {t('common.featured')}</span>}
                  <span className="badge">{profile.memberNo}</span>
                </div>
                <h1 className="text-2xl font-extrabold leading-tight sm:text-4xl">{name}</h1>
                {profile.fullNameEn && <p className="mt-0.5 text-sm font-medium" style={{ color: 'var(--muted)' }} dir="ltr">{profile.fullNameEn}</p>}
                <p className="mt-2 text-base font-bold sm:text-lg" style={{ color: 'var(--pa)' }}>
                  {specialty}{profile.titleAr || profile.titleEn ? ` · ${pick(profile.titleAr, profile.titleEn)}` : ''}
                </p>
                <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs sm:justify-start" style={{ color: 'var(--muted)' }}>
                  {city && <span className="inline-flex items-center gap-1"><MapPin size={13} /> {city}</span>}
                  <span className="inline-flex items-center gap-1"><Eye size={13} /> {t('prof.viewCount', { count: formatNumber(profile.views) })}</span>
                  <span className="inline-flex items-center gap-1"><CalendarDays size={13} /> {t('prof.joined')} {formatDate(profile.createdAt)}</span>
                </div>
              </div>

              <div className="grid w-full shrink-0 grid-cols-2 gap-2 sm:w-auto sm:grid-cols-1 lg:grid-cols-2">
                <button className="btn btn-primary btn-sm" onClick={() => downloadVCard(profile)}><Download size={15} /> {t('prof.saveContact')}</button>
                <button className="btn btn-ghost btn-sm" onClick={nativeShare}><Share2 size={15} /> {t('prof.share')}</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setQrOpen(true)}><QrCode size={15} /> {t('prof.qr')}</button>
                <Link to={`/${profile.handle}/print`} target="_blank" className="btn btn-ghost btn-sm"><Printer size={15} /> {t('prof.print')}</Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container-page mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-6">
          <section className="card p-5 sm:p-7">
            <h2 className="section-title"><span className="section-dot" /> {t('prof.about')}</h2>
            {pick(profile.bioAr, profile.bioEn) ? (
              <p className="mt-3 whitespace-pre-line text-[15px] leading-8" style={{ color: 'var(--muted)' }}>{pick(profile.bioAr, profile.bioEn)}</p>
            ) : (
              <p className="mt-3 text-sm" style={{ color: 'var(--muted)' }}>{t('prof.noBio')}</p>
            )}
          </section>

          {profile.buttons.length > 0 && (
            <section className="grid gap-2 sm:grid-cols-2">
              {profile.buttons.map((button) => {
                const Icon = getIcon(button.icon);
                return (
                  <ExternalAction
                    key={button.id}
                    href={button.url}
                    className="group flex min-h-14 items-center gap-3 rounded-2xl px-4 py-3 font-bold text-white shadow-lg transition-transform hover:-translate-y-0.5"
                    style={{ background: `linear-gradient(135deg, ${button.color}, color-mix(in srgb, ${button.color} 65%, #000))` }}
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/15"><Icon size={18} /></span>
                    <span className="min-w-0 flex-1 truncate text-sm">{pick(button.labelAr, button.labelEn)}</span>
                    <ArrowLeft size={16} className="shrink-0 opacity-70 transition-transform group-hover:-translate-x-1 rtl:rotate-180" />
                  </ExternalAction>
                );
              })}
            </section>
          )}

          <section className="card p-5 sm:p-7">
            <h2 className="section-title"><span className="section-dot" /> {t('prof.services')}</h2>
            {profile.services.length ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {profile.services.map((service) => {
                  const Icon = getIcon(service.icon);
                  return (
                    <div key={service.id} className="rounded-2xl border p-4 transition-colors hover:bg-[var(--surface-2)]" style={{ borderColor: 'var(--line)' }}>
                      <span className="grid h-10 w-10 place-items-center rounded-xl" style={{ background: 'var(--brand-soft)', color: 'var(--pa)' }}><Icon size={19} /></span>
                      <h3 className="mt-2.5 text-sm font-extrabold">{pick(service.titleAr, service.titleEn)}</h3>
                      {pick(service.descAr, service.descEn) && <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>{pick(service.descAr, service.descEn)}</p>}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="mt-3 text-sm" style={{ color: 'var(--muted)' }}>{t('prof.noServices')}</p>
            )}
          </section>

          <section className="card p-5 sm:p-7">
            <h2 className="section-title"><span className="section-dot" /> {t('prof.skills')}</h2>
            {profile.skills.length ? (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {profile.skills.map((item, index) => (
                  <button key={item.key} onClick={() => setLightbox({ items: profile.skills, index })} className="group relative aspect-square overflow-hidden rounded-2xl border" style={{ borderColor: 'var(--line)' }}>
                    <img src={avatarUrl(item.key)} alt={pick(item.captionAr || '', item.captionEn || '')} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80" />
                    {pick(item.captionAr || '', item.captionEn || '') && <span className="absolute inset-x-0 bottom-0 line-clamp-2 p-2 text-[11px] font-bold text-white">{pick(item.captionAr || '', item.captionEn || '')}</span>}
                  </button>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm" style={{ color: 'var(--muted)' }}>{t('prof.noSkills')}</p>
            )}
          </section>

          <section className="card p-5 sm:p-7">
            <h2 className="section-title"><span className="section-dot" /> {t('prof.works')}</h2>
            {profile.works.length ? (
              <div className="mt-4 grid grid-cols-2 gap-3">
                {profile.works.map((item, index) => (
                  <button key={item.key} onClick={() => setLightbox({ items: profile.works, index })} className="group relative aspect-[4/3] overflow-hidden rounded-2xl border" style={{ borderColor: 'var(--line)' }}>
                    <img src={avatarUrl(item.key)} alt={pick(item.captionAr || '', item.captionEn || '')} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <span className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    {pick(item.captionAr || '', item.captionEn || '') && <span className="absolute inset-x-0 bottom-0 line-clamp-2 p-2.5 text-xs font-bold text-white">{pick(item.captionAr || '', item.captionEn || '')}</span>}
                  </button>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm" style={{ color: 'var(--muted)' }}>{t('prof.noWorks')}</p>
            )}
          </section>

          <section className="card p-5 sm:p-7">
            <h2 className="section-title"><span className="section-dot" /> {t('prof.videos')}</h2>
            {profile.videos.length ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {profile.videos.map((video) => (
                  <YouTubeEmbed key={video.id} video={video} title={pick(video.titleAr, video.titleEn) || name} />
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm" style={{ color: 'var(--muted)' }}>{t('prof.noVideos')}</p>
            )}
          </section>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24">
          <section className="card p-5">
            <h2 className="section-title"><span className="section-dot" /> {t('prof.contact')}</h2>
            <div className="mt-4 space-y-2">
              {profile.phone && (
                <ExternalAction href={`tel:${profile.phone}`} className="flex items-center gap-3 rounded-xl px-2 py-2 text-sm transition-colors hover:bg-[var(--surface-2)]">
                  <span className="grid h-9 w-9 place-items-center rounded-xl" style={{ background: 'var(--brand-soft)', color: 'var(--pa)' }}><Phone size={16} /></span>
                  <span className="min-w-0 flex-1 truncate" dir="ltr">{profile.phone}</span>
                </ExternalAction>
              )}
              {waHref && (
                <ExternalAction href={waHref} className="flex items-center gap-3 rounded-xl px-2 py-2 text-sm transition-colors hover:bg-[var(--surface-2)]">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#25d366]/15 text-[#1da851]"><MessageCircle size={16} /></span>
                  <span className="flex-1">{t('prof.whatsapp')}</span>
                </ExternalAction>
              )}
              {profile.publicEmail && (
                <ExternalAction href={`mailto:${profile.publicEmail}`} className="flex items-center gap-3 rounded-xl px-2 py-2 text-sm transition-colors hover:bg-[var(--surface-2)]">
                  <span className="grid h-9 w-9 place-items-center rounded-xl" style={{ background: 'var(--brand-soft)', color: 'var(--pa)' }}><Mail size={16} /></span>
                  <span className="min-w-0 flex-1 truncate" dir="ltr">{profile.publicEmail}</span>
                </ExternalAction>
              )}
              {websiteHref && (
                <ExternalAction href={websiteHref} className="flex items-center gap-3 rounded-xl px-2 py-2 text-sm transition-colors hover:bg-[var(--surface-2)]">
                  <span className="grid h-9 w-9 place-items-center rounded-xl" style={{ background: 'var(--brand-soft)', color: 'var(--pa)' }}><Globe2 size={16} /></span>
                  <span className="min-w-0 flex-1 truncate" dir="ltr">{profile.website.replace(/^https?:\/\//, '')}</span>
                </ExternalAction>
              )}
              {!profile.phone && !profile.whatsapp && !profile.publicEmail && !websiteHref && profile.socials.length === 0 && (
                <p className="text-sm" style={{ color: 'var(--muted)' }}>{t('prof.noLinks')}</p>
              )}
            </div>
            {profile.socials.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2 border-t pt-4" style={{ borderColor: 'var(--line)' }}>
                {profile.socials.map((social) => (
                  <ExternalAction key={`${social.platform}-${social.value}`} href={socialHref(social.platform, social.value) || '#'} className="grid h-10 w-10 place-items-center rounded-xl border transition-transform hover:-translate-y-0.5" style={{ borderColor: 'var(--line)' }}>
                    <span className="text-[var(--pa)]"><SocialIcon platform={social.platform} size={18} /></span>
                  </ExternalAction>
                ))}
              </div>
            )}
            <div className="mt-4 grid gap-2">
              <button className="btn btn-primary w-full" onClick={() => downloadVCard(profile)}><Download size={16} /> {t('prof.downloadVcard')}</button>
              <button className="btn btn-ghost w-full" onClick={copy}><Copy size={16} /> {t('prof.copyLink')}</button>
            </div>
          </section>

          <section className="card overflow-hidden">
            <div className="p-5 pb-3">
              <h2 className="section-title"><span className="section-dot" /> {t('prof.qr')}</h2>
              <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>{t('prof.scanQr')}</p>
            </div>
            <button className="mx-auto block rounded-2xl border bg-white p-2.5" style={{ borderColor: 'var(--line)' }} onClick={() => setQrOpen(true)}>
              {siteQr ? <img src={siteQr} alt={t('prof.qrSiteHint')} className="h-40 w-40" /> : <span className="grid h-40 w-40 place-items-center"><QrCode size={60} className="opacity-30" /></span>}
            </button>
            <p className="mt-2 pb-4 text-center text-[11px]" style={{ color: 'var(--muted-2)' }}>ksa.doctor/{profile.handle}</p>
            <button className="flex w-full items-center justify-center gap-2 border-t py-3 text-sm font-bold" style={{ borderColor: 'var(--line)', color: 'var(--pa)' }} onClick={() => setQrOpen(true)}>
              <Download size={15} /> {t('dash.downloadPng')} / SVG
            </button>
          </section>

          <section className="card p-5">
            <h2 className="section-title"><span className="section-dot" /> {t('dash.accountInfo')}</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-2"><dt style={{ color: 'var(--muted)' }}>{t('prof.memberId')}</dt><dd className="font-bold">{profile.memberNo}</dd></div>
              <div className="flex items-center justify-between gap-2"><dt style={{ color: 'var(--muted)' }}>{t('prof.joined')}</dt><dd className="font-bold">{formatDate(profile.createdAt)}</dd></div>
              <div className="flex items-center justify-between gap-2"><dt style={{ color: 'var(--muted)' }}>{t('prof.views')}</dt><dd className="font-bold">{formatNumber(profile.views)}</dd></div>
            </dl>
            <div className="mt-4 rounded-xl border p-3 text-xs leading-relaxed" style={{ borderColor: 'var(--line)', background: 'var(--surface-2)', color: 'var(--muted)' }}>
              <Sparkles size={14} className="mb-1 inline" style={{ color: 'var(--gold)' }} /> {t('app.slogan')}
            </div>
            <a href={`mailto:hello@ksa.doctor?subject=${encodeURIComponent(`Report ${profile.handle}`)}`} className="mt-3 block text-center text-[11px] underline underline-offset-4" style={{ color: 'var(--muted-2)' }}>{t('prof.report')}</a>
          </section>
        </aside>
      </div>

      <div className="container-page py-10">
        <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border p-5 text-center sm:flex-row sm:text-start" style={{ borderColor: 'var(--line)', background: 'var(--surface)' }}>
          <div>
            <p className="text-sm font-extrabold">{t('app.name')}</p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>{t('app.slogan')}</p>
          </div>
          <Link to="/search" className="btn btn-ghost btn-sm">{t('prof.backToSearch')} <ArrowLeft size={15} className="rtl:rotate-180" /></Link>
        </div>
      </div>

      <Modal open={qrOpen} onClose={() => setQrOpen(false)} title={t('prof.qr')} subtitle={t('prof.scanQr')} size="lg">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="rounded-2xl border p-4 text-center" style={{ borderColor: 'var(--line)' }}>
            <h3 className="mb-3 text-sm font-extrabold">{t('prof.qrSiteHint')}</h3>
            {siteQr ? <img src={siteQr} alt="" className="mx-auto h-52 w-52 rounded-xl bg-white p-2" /> : <div className="skeleton mx-auto h-52 w-52" />}
            <div className="mt-4 flex justify-center gap-2">
              <button className="btn btn-ghost btn-sm" onClick={downloadSitePng}><Download size={14} /> PNG</button>
              <button className="btn btn-ghost btn-sm" onClick={() => downloadQrSvg(siteUrl, `${profile.handle}-qr.svg`)}><Download size={14} /> SVG</button>
            </div>
          </div>
          <div className="rounded-2xl border p-4 text-center" style={{ borderColor: 'var(--line)' }}>
            <h3 className="mb-3 text-sm font-extrabold">{t('prof.qrVcardHint')}</h3>
            {vcardQr ? <img src={vcardQr} alt="" className="mx-auto h-52 w-52 rounded-xl bg-white p-2" /> : <div className="skeleton mx-auto h-52 w-52" />}
            <div className="mt-4 flex justify-center gap-2">
              <button className="btn btn-ghost btn-sm" onClick={downloadVcardPng}><Download size={14} /> PNG</button>
              <button className="btn btn-ghost btn-sm" onClick={() => downloadQrSvg(buildVCard(profile), `${profile.handle}-vcard-qr.svg`)}><Download size={14} /> SVG</button>
            </div>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <button className="btn btn-primary btn-sm" onClick={nativeShare}><Share2 size={15} /> {t('prof.shareProfile')}</button>
          <button className="btn btn-ghost btn-sm" onClick={copy}><Copy size={15} /> {t('prof.copyLink')}</button>
        </div>
      </Modal>

      <Modal open={shareOpen} onClose={() => setShareOpen(false)} title={t('prof.shareProfile')} subtitle={shareText} size="md">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {shareLinks.map(({ key, href, color, Icon }) => (
            <a key={key} href={href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-2xl border p-3 text-sm font-bold transition-transform hover:-translate-y-0.5" style={{ borderColor: 'var(--line)' }}>
              <span className="grid h-8 w-8 place-items-center rounded-lg text-white" style={{ background: color }}><Icon size={15} /></span>
              <span className="truncate">{t(`prof.share${key === 'x' ? 'X' : key.charAt(0).toUpperCase() + key.slice(1)}`)}</span>
            </a>
          ))}
        </div>
        <button className="btn btn-primary mt-4 w-full" onClick={async () => { await nativeShare(); }}>
          <Share2 size={16} /> {t('prof.shareProfile')}
        </button>
        <button className="btn btn-ghost mt-2 w-full" onClick={copy}><Copy size={16} /> {t('prof.copyLink')}</button>
      </Modal>

      {lightbox && <ImageLightbox items={lightbox.items} index={lightbox.index} onIndexChange={(index) => setLightbox({ ...lightbox, index })} onClose={() => setLightbox(null)} />}
    </div>
  );
}
