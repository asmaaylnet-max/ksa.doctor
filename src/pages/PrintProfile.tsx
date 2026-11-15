import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BadgeCheck, Download, MapPin, Printer, QrCode } from 'lucide-react';
import type { UserPublic } from '../../shared/types';
import { CITY_MAP } from '../../shared/data';
import { api } from '../lib/api';
import { useI18n } from '../i18n';
import { avatarUrl, coverUrl } from '../lib/media';
import { absoluteUrl } from '../lib/format';
import { qrDataUrl } from '../lib/qr';
import { getIcon } from '../lib/icons';

interface Response { state: string; profile?: UserPublic }

export default function PrintProfile() {
  const { handle = '' } = useParams();
  const { t, lang, pick, formatNumber, formatDate } = useI18n();
  const [profile, setProfile] = useState<UserPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [qr, setQr] = useState('');

  useEffect(() => {
    let cancelled = false;
    api<Response>(`/public/${encodeURIComponent(handle)}`)
      .then((res) => {
        if (!cancelled) setProfile(res.profile || null);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [handle]);

  useEffect(() => {
    if (!profile) return;
    qrDataUrl(absoluteUrl(`/${profile.handle}`), 320).then(setQr).catch(() => undefined);
    document.title = `${pick(profile.fullNameAr, profile.fullNameEn)} — ${t('prof.downloadProfile')}`;
  }, [profile, pick, t]);

  if (loading) return <div className="container-page py-16"><div className="skeleton mx-auto h-[600px] max-w-3xl" /></div>;
  if (!profile) return <div className="container-page py-16 text-center">{t('prof.notFoundTitle')}</div>;

  const name = pick(profile.fullNameAr, profile.fullNameEn);
  const specialty = pick(profile.specialtyAr, profile.specialtyEn);
  const city = CITY_MAP[profile.city] ? (lang === 'ar' ? CITY_MAP[profile.city].ar : CITY_MAP[profile.city].en) : '';
  const bio = pick(profile.bioAr, profile.bioEn);
  const websiteHref = profile.website ? (/^https?:\/\//i.test(profile.website) ? profile.website : `https://${profile.website}`) : '';

  return (
    <div className="min-h-screen py-8" style={{ background: 'var(--bg)' }}>
      <div className="no-print mx-auto mb-4 flex max-w-[820px] flex-wrap items-center justify-between gap-2 px-4">
        <Link to={`/${profile.handle}`} className="btn btn-ghost btn-sm"><ArrowLeft size={15} className="rtl:rotate-180" /> {t('common.back')}</Link>
        <div className="flex gap-2">
          <button className="btn btn-primary btn-sm" onClick={() => window.print()}><Printer size={16} /> {t('prof.print')}</button>
          <span className="self-center text-xs" style={{ color: 'var(--muted)' }}>{t('prof.printHint')}</span>
        </div>
      </div>

      <article id="print-sheet" className="mx-auto max-w-[820px] overflow-hidden rounded-[24px] border bg-white text-[#14231b] shadow-2xl print:max-w-none print:rounded-none print:border-0 print:shadow-none" style={{ borderColor: '#e5e1d6' }}>
        <header className="relative h-44 overflow-hidden bg-[#043824]">
          <img src={coverUrl(profile.coverKey)} alt="" className="h-full w-full object-cover opacity-55" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(120deg,rgba(4,56,36,.96),rgba(4,56,36,.55))' }} />
          <div className="absolute inset-x-0 bottom-0 flex items-end gap-5 p-7">
            <img src={avatarUrl(profile.avatarKey)} alt={name} className="h-24 w-24 rounded-2xl border-4 border-white object-cover shadow-xl" />
            <div className="min-w-0 flex-1 text-white">
              <div className="mb-1 flex items-center gap-2 text-[11px] font-bold text-[#e8cf9a]"><BadgeCheck size={13} /> {t('prof.verified')} · {profile.memberNo}</div>
              <h1 className="truncate text-2xl font-extrabold">{name}</h1>
              <p className="text-sm text-white/80">{specialty}{city ? ` · ${city}` : ''}</p>
            </div>
            <div className="hidden shrink-0 text-end text-[10px] text-white/60 sm:block">
              <div className="font-bold text-[#e8cf9a]">KSA.DOCTOR</div>
              <div>ksa.doctor/{profile.handle}</div>
            </div>
          </div>
        </header>

        <div className="grid gap-8 p-7 sm:grid-cols-[1fr_190px]">
          <div className="min-w-0 space-y-6">
            {bio && (
              <section>
                <h2 className="mb-2 border-b pb-1 text-sm font-extrabold text-[#043824]" style={{ borderColor: '#e5e1d6' }}>{t('prof.about')}</h2>
                <p className="whitespace-pre-line text-xs leading-6 text-[#4a5a50]">{bio}</p>
              </section>
            )}

            {profile.services.length > 0 && (
              <section>
                <h2 className="mb-2 border-b pb-1 text-sm font-extrabold text-[#043824]" style={{ borderColor: '#e5e1d6' }}>{t('prof.services')}</h2>
                <div className="grid grid-cols-2 gap-2">
                  {profile.services.map((service) => {
                    const Icon = getIcon(service.icon);
                    return (
                      <div key={service.id} className="rounded-lg border p-2.5" style={{ borderColor: '#e5e1d6' }}>
                        <div className="flex items-center gap-1.5 text-[11px] font-bold"><Icon size={13} className="text-[#006830]" /> {pick(service.titleAr, service.titleEn)}</div>
                        {pick(service.descAr, service.descEn) && <p className="mt-1 text-[10px] leading-4 text-[#5b6a60]">{pick(service.descAr, service.descEn)}</p>}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {profile.skills.length > 0 && (
              <section>
                <h2 className="mb-2 border-b pb-1 text-sm font-extrabold text-[#043824]" style={{ borderColor: '#e5e1d6' }}>{t('prof.skills')}</h2>
                <div className="grid grid-cols-4 gap-2">
                  {profile.skills.map((item) => <img key={item.key} src={avatarUrl(item.key)} alt="" className="aspect-square w-full rounded-lg object-cover" />)}
                </div>
              </section>
            )}

            {profile.works.length > 0 && (
              <section>
                <h2 className="mb-2 border-b pb-1 text-sm font-extrabold text-[#043824]" style={{ borderColor: '#e5e1d6' }}>{t('prof.works')}</h2>
                <div className="grid grid-cols-2 gap-2">
                  {profile.works.map((item) => <img key={item.key} src={avatarUrl(item.key)} alt="" className="aspect-[4/3] w-full rounded-lg object-cover" />)}
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-4">
            <section className="rounded-xl border p-3" style={{ borderColor: '#e5e1d6' }}>
              <h2 className="mb-2 text-[11px] font-extrabold uppercase tracking-widest text-[#8a6a2f]">{t('prof.contact')}</h2>
              <div className="space-y-1.5 text-[11px] leading-5 text-[#3b4b41]">
                {profile.phone && <div dir="ltr">{profile.phone}</div>}
                {profile.whatsapp && <div dir="ltr">{profile.whatsapp}</div>}
                {profile.publicEmail && <div className="break-all" dir="ltr">{profile.publicEmail}</div>}
                {websiteHref && <div className="break-all" dir="ltr">{profile.website}</div>}
                {city && <div className="flex items-center gap-1"><MapPin size={11} /> {city}</div>}
              </div>
            </section>

            <section className="rounded-xl border p-3 text-center" style={{ borderColor: '#e5e1d6' }}>
              <h2 className="mb-2 text-[11px] font-extrabold uppercase tracking-widest text-[#8a6a2f]">{t('prof.qr')}</h2>
              {qr ? <img src={qr} alt="" className="mx-auto h-36 w-36" /> : <QrCode size={60} className="mx-auto text-[#006830]" />}
              <div className="mt-2 text-[10px] font-bold text-[#043824]" dir="ltr">ksa.doctor/{profile.handle}</div>
            </section>

            <section className="rounded-xl bg-[#f4f1e7] p-3 text-[10px] leading-5 text-[#5b6a60]">
              <div className="font-bold text-[#043824]">{t('app.name')}</div>
              <div>{t('app.slogan')}</div>
              <div className="mt-2">{t('prof.joined')} {formatDate(profile.createdAt)} · {formatNumber(profile.views)} {t('prof.views')}</div>
            </section>
          </aside>
        </div>

        <footer className="flex items-center justify-between border-t px-7 py-3 text-[9px] text-[#7b8a80]" style={{ borderColor: '#e5e1d6' }}>
          <span>ksa.doctor/{profile.handle}</span>
          <span>{t('common.madeIn')}</span>
        </footer>
      </article>

      <style>{`
        @media print {
          @page { size: A4; margin: 0; }
          body { background: #fff !important; }
          .no-print { display: none !important; }
          #print-sheet { width: 210mm; min-height: 297mm; border-radius: 0 !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>
      <div className="no-print mx-auto mt-4 max-w-[820px] px-4 text-center text-xs" style={{ color: 'var(--muted)' }}>
        <Download size={13} className="inline" /> {t('prof.printHint')}
      </div>
    </div>
  );
}
