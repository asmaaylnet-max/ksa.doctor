import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  Circle,
  Copy,
  Eye,
  Gauge,
  Hash,
  ImagePlus,
  LayoutList,
  QrCode,
  Share2,
  Sparkles,
  TriangleAlert,
  UserRoundPen
} from 'lucide-react';
import type { UserPrivate } from '../../../shared/types';
import { useI18n } from '../../i18n';
import { useToast } from '../../lib/toast';
import { absoluteUrl, copyText } from '../../lib/format';
import { api, getErrorMessage } from '../../lib/api';
import { avatarUrl } from '../../lib/media';
import { StatusBadge } from '../../components/StatusBadge';

export function Overview({ user, onTab }: { user: UserPrivate; onTab: (tab: string) => void }) {
  const { t, pick, formatNumber, formatDate } = useI18n();
  const { toast } = useToast();
  const [resubmitting, setResubmitting] = useState(false);
  const publicUrl = absoluteUrl(`/${user.handle}`);
  const name = pick(user.fullNameAr, user.fullNameEn);

  const steps = useMemo(
    () => [
      { key: 'photo', done: !!user.avatarKey && !!user.coverKey, label: t('dash.stepPhoto'), tab: 'media' },
      { key: 'bio', done: pick(user.bioAr, user.bioEn).trim().length >= 20, label: t('dash.stepBio'), tab: 'profile' },
      { key: 'services', done: user.services.length > 0, label: t('dash.stepServices'), tab: 'links' },
      { key: 'socials', done: user.socials.length > 0, label: t('dash.stepSocials'), tab: 'links' },
      { key: 'skills', done: user.skills.length >= 4, label: t('dash.stepSkills'), tab: 'media' },
      { key: 'works', done: user.works.length >= 4, label: t('dash.stepWorks'), tab: 'media' },
      { key: 'video', done: user.videos.length > 0, label: t('dash.stepVideo'), tab: 'links' }
    ],
    [user, t, pick]
  );
  const doneCount = steps.filter((s) => s.done).length;
  const percent = Math.round((doneCount / steps.length) * 100);
  const completion = Math.max(percent, user.profileCompletion || 0);

  const copy = async () => {
    const ok = await copyText(publicUrl);
    toast(ok ? t('prof.copied') : t('common.error'), ok ? 'success' : 'error');
  };

  const resubmit = async () => {
    setResubmitting(true);
    try {
      const res = await api<{ user: UserPrivate }>('/me/resubmit', { method: 'POST' });
      toast(t('dash.resubmit'), 'success');
      window.dispatchEvent(new CustomEvent('ksd:user-updated', { detail: res.user }));
      setResubmitting(false);
    } catch (err) {
      toast(getErrorMessage(err, t), 'error');
      setResubmitting(false);
    }
  };

  const statusBanner = {
    pending: { title: t('dash.pendingTitle'), body: t('dash.pendingBody'), tone: 'warn' as const, Icon: Sparkles },
    approved: user.visible
      ? { title: t('dash.approvedTitle'), body: t('dash.approvedBody'), tone: 'ok' as const, Icon: BadgeCheck }
      : { title: t('dash.hiddenTitle'), body: t('dash.hiddenBody'), tone: 'warn' as const, Icon: Eye },
    rejected: { title: t('dash.rejectedTitle'), body: t('dash.rejectedBody'), tone: 'danger' as const, Icon: TriangleAlert },
    suspended: { title: t('dash.suspendedTitle'), body: t('dash.suspendedBody'), tone: 'danger' as const, Icon: TriangleAlert }
  }[user.status];

  const toneStyle = statusBanner.tone === 'ok'
    ? { background: 'var(--ok-soft)', borderColor: 'var(--ok)', color: 'var(--text)' }
    : statusBanner.tone === 'warn'
      ? { background: 'var(--warn-soft)', borderColor: 'var(--warn)', color: 'var(--text)' }
      : { background: 'var(--danger-soft)', borderColor: 'var(--danger)', color: 'var(--text)' };

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-[28px] p-5 text-white shadow-2xl sm:p-7" style={{ background: 'linear-gradient(135deg,#022c1c 0%,#065c3b 55%,#043824 100%)' }}>
        <div className="absolute inset-0 opacity-[0.12]" style={{ backgroundImage: 'linear-gradient(45deg,#fff 1px,transparent 1px),linear-gradient(-45deg,#fff 1px,transparent 1px)', backgroundSize: '26px 26px' }} />
        <div className="absolute -end-16 -top-20 h-56 w-56 rounded-full" style={{ background: 'radial-gradient(circle,rgba(200,164,92,.45),transparent 70%)' }} />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="relative shrink-0 self-center sm:self-auto">
            <span className="absolute -inset-1 rounded-[26px]" style={{ background: 'linear-gradient(135deg,#c8a45c,rgba(200,164,92,.1))' }} />
            <img src={avatarUrl(user.avatarKey)} alt={name} className="relative h-20 w-20 rounded-[22px] border-2 border-white/20 object-cover sm:h-24 sm:w-24" />
            <span className="absolute -bottom-1 -end-1 grid h-7 w-7 place-items-center rounded-full bg-[#f8f4e9] text-[#006830]"><BadgeCheck size={17} /></span>
          </div>
          <div className="min-w-0 flex-1 text-center sm:text-start">
            <div className="flex flex-wrap items-center justify-center gap-1.5 sm:justify-start">
              <StatusBadge status={user.status} />
              <span className="badge bg-white/10 text-white">{user.memberNo}</span>
            </div>
            <h1 className="mt-2 truncate text-2xl font-extrabold sm:text-3xl">{t('dash.greeting', { name })}</h1>
            <p className="mt-1 truncate text-sm text-white/70">{pick(user.specialtyAr, user.specialtyEn)} · ksa.doctor/{user.handle}</p>
          </div>
          <div className="flex shrink-0 flex-wrap justify-center gap-2">
            {user.visible && user.status === 'approved' && (
              <>
                <Link to={`/${user.handle}`} target="_blank" className="btn btn-gold btn-sm"><Eye size={15} /> {t('dash.viewProfile')}</Link>
                <button className="btn btn-sm border border-white/25 bg-white/10 text-white hover:bg-white/20" onClick={copy}><Copy size={15} /> {t('dash.copyLink')}</button>
              </>
            )}
          </div>
        </div>
      </section>

      <div className="flex items-start gap-3 rounded-2xl border p-4" style={toneStyle}>
        <statusBanner.Icon size={20} className="mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-extrabold">{statusBanner.title}</h2>
          <p className="mt-0.5 text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>{statusBanner.body}</p>
          {user.status === 'rejected' && user.rejectionReason && (
            <div className="mt-2 rounded-xl border px-3 py-2 text-xs" style={{ borderColor: 'var(--line)', background: 'var(--surface)' }}>
              <span className="font-bold">{t('adm.rejectReason')}: </span>{user.rejectionReason}
            </div>
          )}
        </div>
        {user.status === 'rejected' && (
          <button className="btn btn-primary btn-sm shrink-0" disabled={resubmitting} onClick={resubmit}>
            {resubmitting ? t('dash.resubmitting') : t('dash.resubmit')}
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { Icon: Eye, label: t('dash.statsViews'), value: formatNumber(user.views) },
          { Icon: Gauge, label: t('dash.statsCompletion'), value: `${formatNumber(completion)}%` },
          { Icon: Hash, label: t('dash.memberNo'), value: user.memberNo }
        ].map(({ Icon, label, value }) => (
          <div key={label} className="card p-4 text-center sm:text-start">
            <span className="mx-auto grid h-9 w-9 place-items-center rounded-xl sm:mx-0" style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}><Icon size={17} /></span>
            <p className="mt-2 text-lg font-extrabold sm:text-2xl">{value}</p>
            <p className="text-[10px] font-medium sm:text-xs" style={{ color: 'var(--muted)' }}>{label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <section className="card p-5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-extrabold">{t('dash.nextSteps')}</h2>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>{t('dash.completionHint')}</p>
            </div>
            <span className="badge badge-brand">{formatNumber(doneCount)}/{formatNumber(steps.length)}</span>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full" style={{ background: 'var(--line)' }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${completion}%`, background: 'linear-gradient(90deg,var(--brand),var(--gold))' }} />
          </div>
          <div className="mt-4 grid gap-1.5 sm:grid-cols-2">
            {steps.map((step) => (
              <button key={step.key} onClick={() => onTab(step.tab)} className="flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-start text-sm transition-colors hover:bg-[var(--surface-2)]">
                {step.done ? <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full" style={{ background: 'var(--ok)', color: '#fff' }}><Check size={12} /></span> : <Circle size={20} className="shrink-0 opacity-25" />}
                <span className={`min-w-0 flex-1 truncate ${step.done ? 'line-through opacity-55' : 'font-medium'}`}>{step.label}</span>
                <ArrowLeft size={14} className="shrink-0 opacity-30 rtl:rotate-180" />
              </button>
            ))}
          </div>
        </section>

        <div className="space-y-3">
          <button onClick={() => onTab('profile')} className="card flex w-full items-center gap-3 p-4 text-start transition-transform hover:-translate-y-0.5">
            <span className="grid h-10 w-10 place-items-center rounded-xl" style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}><UserRoundPen size={19} /></span>
            <span className="min-w-0 flex-1"><span className="block text-sm font-bold">{t('dash.editProfile')}</span><span className="block text-xs" style={{ color: 'var(--muted)' }}>{t('dash.basicInfoSub')}</span></span>
            <ArrowLeft size={15} className="opacity-30 rtl:rotate-180" />
          </button>
          <button onClick={() => onTab('media')} className="card flex w-full items-center gap-3 p-4 text-start transition-transform hover:-translate-y-0.5">
            <span className="grid h-10 w-10 place-items-center rounded-xl" style={{ background: 'var(--gold-soft)', color: 'var(--gold)' }}><ImagePlus size={19} /></span>
            <span className="min-w-0 flex-1"><span className="block text-sm font-bold">{t('dash.media')}</span><span className="block text-xs" style={{ color: 'var(--muted)' }}>{t('dash.skillsSub')}</span></span>
            <ArrowLeft size={15} className="opacity-30 rtl:rotate-180" />
          </button>
          <button onClick={() => onTab('share')} className="card flex w-full items-center gap-3 p-4 text-start transition-transform hover:-translate-y-0.5">
            <span className="grid h-10 w-10 place-items-center rounded-xl" style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}><QrCode size={19} /></span>
            <span className="min-w-0 flex-1"><span className="block text-sm font-bold">{t('dash.qrTitle')}</span><span className="block text-xs" style={{ color: 'var(--muted)' }}>{t('dash.qrSub')}</span></span>
            <ArrowLeft size={15} className="opacity-30 rtl:rotate-180" />
          </button>
        </div>
      </div>

      <section className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-sm font-extrabold">{t('dash.publicLink')}</h2>
            <p className="mt-0.5 truncate text-xs" dir="ltr" style={{ color: 'var(--muted)' }}>ksa.doctor/{user.handle}</p>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-ghost btn-sm" onClick={copy}><Copy size={14} /> {t('common.copy')}</button>
            <button className="btn btn-primary btn-sm" onClick={() => onTab('share')}><Share2 size={14} /> {t('prof.share')}</button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]" style={{ color: 'var(--muted-2)' }}>
          <span>{t('common.memberSince')} {formatDate(user.createdAt)}</span>
          <span>{t('dash.lastLogin')}: {formatDate(user.lastLoginAt, true)}</span>
          {user.featured && <span className="inline-flex items-center gap-1" style={{ color: 'var(--gold)' }}><Sparkles size={12} /> {t('dash.featuredLabel')}</span>}
        </div>
      </section>
    </div>
  );
}
