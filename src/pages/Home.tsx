import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, BadgeCheck, Download, Link2, ShieldCheck, Sparkles } from 'lucide-react';
import { api } from '../lib/api';
import type { MetaResponse } from '../../shared/types';
import { SPECIALTIES } from '../../shared/data';
import { useI18n } from '../i18n';
import { SearchBar } from '../components/SearchBar';
import { openInstallModal } from '../lib/install';

export default function Home() {
  const { t, lang, formatNumber } = useI18n();
  const navigate = useNavigate();
  const [meta, setMeta] = useState<MetaResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    api<MetaResponse>('/meta')
      .then((data) => {
        if (!cancelled) setMeta(data);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const popular = meta?.specialties?.length
    ? meta.specialties.slice(0, 6)
    : SPECIALTIES.slice(0, 6).map((s) => ({ ar: s.ar, en: s.en, count: 0 }));

  const features = [
    { Icon: BadgeCheck, title: t('home.feature1Title'), body: t('home.feature1Body') },
    { Icon: Link2, title: t('home.feature2Title'), body: t('home.feature2Body') },
    { Icon: ShieldCheck, title: t('home.feature3Title'), body: t('home.feature3Body') }
  ];

  return (
    <div>
      <section className="relative isolate overflow-hidden">
        <div className="aurora-blob -top-24 start-[8%] h-72 w-72" style={{ background: 'var(--brand)', opacity: 0.16 }} />
        <div className="aurora-blob top-40 end-[4%] h-80 w-80" style={{ background: 'var(--gold)', opacity: 0.14, animationDelay: '-6s' }} />
        <div className="container-page relative flex min-h-[calc(100dvh-68px)] flex-col items-center justify-center py-12 text-center sm:py-16">
          <span className="kicker animate-fade-up"><Sparkles size={13} /> {t('home.kicker')}</span>

          <div className="medallion-wrap my-7 animate-fade-up sm:my-9" style={{ animationDelay: '80ms' }}>
            <span className="medallion-glow" />
            <span className="medallion-ring" />
            <span className="medallion-ring" />
            <span className="medallion-ring" />
            <span className="medallion-orbit" />
            <span className="medallion-disc">
              <img src="/brand/emblem.png" alt={t('app.name')} width={512} height={512} fetchPriority="high" />
            </span>
          </div>

          <h1 className="max-w-3xl animate-fade-up text-[clamp(2rem,6vw,4.2rem)] font-extrabold leading-[1.12] tracking-tight" style={{ animationDelay: '140ms' }}>
            {t('home.title')}
          </h1>
          <p className="mt-3 animate-fade-up text-lg font-bold sm:text-2xl" style={{ color: 'var(--gold)', animationDelay: '200ms' }}>
            {t('home.slogan')}
          </p>
          <p className="mt-4 max-w-xl animate-fade-up text-sm leading-relaxed sm:text-base" style={{ color: 'var(--muted)', animationDelay: '260ms' }}>
            {t('home.subtitle')}
          </p>

          <div className="mt-7 w-full animate-fade-up" style={{ animationDelay: '320ms' }}>
            <SearchBar variant="hero" />
          </div>

          <div className="mt-5 flex max-w-3xl animate-fade-up flex-wrap items-center justify-center gap-2" style={{ animationDelay: '380ms' }}>
            <span className="text-xs font-bold" style={{ color: 'var(--muted-2)' }}>{t('home.popular')}:</span>
            {popular.map((s) => (
              <button key={s.ar} className="chip !min-h-8 !px-3 !py-1 text-xs" onClick={() => navigate(`/search?q=${encodeURIComponent(lang === 'ar' ? s.ar : s.en)}`)}>
                {lang === 'ar' ? s.ar : s.en}
              </button>
            ))}
          </div>

          <div className="mt-7 flex animate-fade-up flex-wrap items-center justify-center gap-3" style={{ animationDelay: '440ms' }}>
            <Link to="/join" className="btn btn-primary btn-lg">
              {t('home.joinCta')} <ArrowLeft size={18} className="rtl:rotate-180" />
            </Link>
            <Link to="/search" className="btn btn-ghost btn-lg">{t('home.explore')}</Link>
            <button onClick={openInstallModal} className="btn btn-ghost btn-lg">
              <Download size={18} /> {t('common.installApp')}
            </button>
          </div>

          <div className="mt-7 flex animate-fade-up flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs" style={{ color: 'var(--muted)', animationDelay: '500ms' }}>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--brand)' }} />
              {meta && meta.members > 0 ? t('home.members', { count: formatNumber(meta.members) }) : t('home.noMembers')}
            </span>
            <span className="hidden sm:inline">·</span>
            <span>{t('home.joinSub')}</span>
          </div>

          {meta?.announcement && (meta.announcement.ar || meta.announcement.en) && (
            <div className="mt-6 max-w-2xl rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: 'var(--gold)', background: 'var(--gold-soft)', color: 'var(--text)' }}>
              {lang === 'ar' ? meta.announcement.ar : meta.announcement.en}
            </div>
          )}
        </div>
      </section>

      <section className="container-page pb-14">
        <div className="grid gap-3 sm:grid-cols-3">
          {features.map(({ Icon, title, body }, index) => (
            <div key={title} className="card flex items-start gap-3 p-5" style={{ animationDelay: `${index * 80}ms` }}>
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl" style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}>
                <Icon size={21} />
              </span>
              <div>
                <h2 className="text-sm font-extrabold">{title}</h2>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>{body}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-xs" style={{ color: 'var(--muted-2)' }}>{t('app.slogan')} · ksa.doctor</p>
      </section>
    </div>
  );
}
