import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  Ban,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  Eye,
  EyeOff,
  Filter,
  LayoutDashboard,
  Loader2,
  Mail,
  PauseCircle,
  RefreshCw,
  RotateCcw,
  ScrollText,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Star,
  UserCheck,
  Users,
  XCircle
} from 'lucide-react';
import type { AdminMember, AdminStats, UserPrivate, UserStatus } from '../../shared/types';
import { CITY_MAP } from '../../shared/data';
import { api, ApiError, getErrorMessage } from '../lib/api';
import { useI18n } from '../i18n';
import { useToast } from '../lib/toast';
import { avatarUrl } from '../lib/media';
import { BrandMark } from '../components/Brand';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { EmptyState } from '../components/EmptyState';

type TabKey = 'overview' | 'members' | 'settings' | 'audit' | 'emails';
interface Settings {
  registrationOpen: boolean;
  announcementAr: string;
  announcementEn: string;
  adminNotify: boolean;
}
interface EmailRow {
  id: number;
  to_email: string;
  template: string;
  subject: string;
  status: string;
  error: string;
  created_at: string;
  sent_at: string;
}
interface AuditRow {
  id: number;
  actor_id: number | null;
  action: string;
  target_type: string;
  target_id: string;
  meta: string;
  created_at: string;
  actor_name: string;
}

const TABS: { key: TabKey; label: string; Icon: typeof LayoutDashboard }[] = [
  { key: 'overview', label: 'adm.overview', Icon: LayoutDashboard },
  { key: 'members', label: 'adm.members', Icon: Users },
  { key: 'settings', label: 'adm.settings', Icon: Settings2 },
  { key: 'audit', label: 'adm.audit', Icon: ScrollText },
  { key: 'emails', label: 'adm.emails', Icon: Mail }
];

function StatCard({ Icon, label, value, tone = 'brand' }: { Icon: typeof Activity; label: string; value: string; tone?: 'brand' | 'gold' | 'ok' | 'warn' | 'danger' }) {
  const style = tone === 'gold'
    ? { background: 'var(--gold-soft)', color: 'var(--gold)' }
    : tone === 'ok'
      ? { background: 'var(--ok-soft)', color: 'var(--ok)' }
      : tone === 'warn'
        ? { background: 'var(--warn-soft)', color: 'var(--warn)' }
        : tone === 'danger'
          ? { background: 'var(--danger-soft)', color: 'var(--danger)' }
          : { background: 'var(--brand-soft)', color: 'var(--brand)' };
  return (
    <div className="card p-4">
      <span className="grid h-9 w-9 place-items-center rounded-xl" style={style}><Icon size={17} /></span>
      <p className="mt-2 text-xl font-extrabold sm:text-2xl">{value}</p>
      <p className="text-[11px] font-medium" style={{ color: 'var(--muted)' }}>{label}</p>
    </div>
  );
}

export default function Admin() {
  const { t } = useI18n();
  const [params, setParams] = useSearchParams();
  const tabParam = params.get('tab') as TabKey | null;
  const tab: TabKey = TABS.some((item) => item.key === tabParam) ? (tabParam as TabKey) : 'overview';
  const [selected, setSelected] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const goTab = (key: string) => {
    const next = new URLSearchParams(params);
    if (key === 'overview') next.delete('tab');
    else next.set('tab', key);
    setParams(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-[100dvh]" style={{ background: 'var(--bg)' }}>
      <header className="sticky top-0 z-40 border-b backdrop-blur-xl" style={{ borderColor: 'var(--line)', background: 'var(--glass)' }}>
        <div className="container-page flex h-16 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <BrandMark />
            <span className="badge badge-gold hidden sm:inline-flex"><ShieldCheck size={12} /> {t('common.admin')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Link to="/dashboard" className="btn btn-ghost btn-sm"><LayoutDashboard size={15} /> <span className="hidden sm:inline">{t('common.dashboard')}</span></Link>
            <Link to="/" className="btn btn-ghost btn-sm"><ArrowLeft size={15} className="rtl:rotate-180" /> <span className="hidden sm:inline">{t('adm.backToSite')}</span></Link>
          </div>
        </div>
        <div className="container-page no-scrollbar flex gap-1 overflow-x-auto pb-2">
          {TABS.map(({ key, label, Icon }) => (
            <button key={key} onClick={() => goTab(key)} className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-colors ${tab === key ? 'bg-[var(--brand)] text-white' : 'hover:bg-[var(--surface-2)]'}`} style={{ color: tab === key ? '#fff' : 'var(--muted)' }}>
              <Icon size={15} /> {t(label)}
            </button>
          ))}
        </div>
      </header>

      <main className="container-page py-5 sm:py-7">
        {tab === 'overview' && <Overview refreshKey={refreshKey} onOpenMember={setSelected} onTab={goTab} />}
        {tab === 'members' && <Members refreshKey={refreshKey} onOpenMember={setSelected} />}
        {tab === 'settings' && <SettingsPanel />}
        {tab === 'audit' && <Audit />}
        {tab === 'emails' && <Emails />}
      </main>

      {selected !== null && (
        <MemberModal
          id={selected}
          onClose={() => setSelected(null)}
          onChanged={() => setRefreshKey((v) => v + 1)}
        />
      )}
    </div>
  );
}

function Overview({ refreshKey, onOpenMember, onTab }: { refreshKey: number; onOpenMember: (id: number) => void; onTab: (tab: string) => void }) {
  const { t, formatNumber } = useI18n();
  const { toast } = useToast();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [pending, setPending] = useState<AdminMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      api<{ stats: AdminStats }>('/admin/stats'),
      api<{ items: AdminMember[] }>('/admin/members?status=pending&page=1')
    ])
      .then(([statsRes, pendingRes]) => {
        if (!cancelled) {
          setStats(statsRes.stats);
          setPending(pendingRes.items.slice(0, 5));
        }
      })
      .catch((err) => {
        if (!cancelled) toast(getErrorMessage(err, t), 'error');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey, t, toast]);

  if (loading) {
    return <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-28" />)}</div>;
  }
  if (!stats) return <EmptyState icon={AlertTriangle} title={t('common.error')} action={<button className="btn btn-ghost" onClick={() => onTab('overview')}>{t('common.retry')}</button>} />;

  const maxVisit = Math.max(1, ...stats.visits14d.map((v) => v.count));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold sm:text-3xl">{t('adm.title')}</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>{t('adm.sub')}</p>
      </div>

      <div className="grid grid-cols-3 gap-2.5 sm:gap-3 lg:grid-cols-6">
        <StatCard Icon={Users} label={t('adm.statsTotal')} value={formatNumber(stats.total)} />
        <StatCard Icon={UserCheck} label={t('adm.statsApproved')} value={formatNumber(stats.approved)} tone="ok" />
        <StatCard Icon={Clock3} label={t('adm.statsPending')} value={formatNumber(stats.pending)} tone="warn" />
        <StatCard Icon={Eye} label={t('adm.statsViews')} value={formatNumber(stats.views)} tone="gold" />
        <StatCard Icon={Search} label={t('adm.statsSearches')} value={formatNumber(stats.searches)} />
        <StatCard Icon={Activity} label={t('adm.statsSignups')} value={formatNumber(stats.signups7d)} />
      </div>

      {stats.pending > 0 && (
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between gap-2 border-b p-4" style={{ borderColor: 'var(--line)' }}>
            <div>
              <h2 className="text-sm font-extrabold">{t('adm.pendingQueue')}</h2>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>{t('adm.pendingBadge', { count: formatNumber(stats.pending) })}</p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => onTab('members')}>{t('common.viewAll')} <ChevronLeft size={14} className="rtl:rotate-180" /></button>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--line)' }}>
            {pending.length === 0 ? <p className="p-5 text-sm" style={{ color: 'var(--muted)' }}>{t('adm.noPending')}</p> : pending.map((member) => (
              <button key={member.id} onClick={() => onOpenMember(member.id)} className="flex w-full items-center gap-3 p-3 text-start transition-colors hover:bg-[var(--surface-2)]">
                <img src={avatarUrl(member.avatarKey)} alt="" className="h-10 w-10 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{member.fullNameAr}</p>
                  <p className="truncate text-xs" style={{ color: 'var(--muted)' }}>{member.specialtyAr || '—'} · ksa.doctor/{member.handle}</p>
                </div>
                <span className="badge badge-warn shrink-0">{t('common.pending')}</span>
                <ChevronLeft size={16} className="shrink-0 opacity-40 rtl:rotate-180" />
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <section className="card p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-extrabold">{t('adm.visits14d')}</h2>
            <span className="badge badge-brand">{formatNumber(stats.visits14d.reduce((a, b) => a + b.count, 0))}</span>
          </div>
          <div className="mt-5 flex h-40 items-end gap-1">
            {stats.visits14d.map((day) => (
              <div key={day.day} className="group flex h-full flex-1 flex-col items-center justify-end gap-1" title={`${day.day}: ${day.count}`}>
                <span className="text-[9px] font-bold opacity-0 transition-opacity group-hover:opacity-100">{formatNumber(day.count)}</span>
                <div className="w-full rounded-t-md transition-all" style={{ height: `${Math.max(3, (day.count / maxVisit) * 100)}%`, background: day.count ? 'linear-gradient(180deg,var(--brand),var(--gold))' : 'var(--line)' }} />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[9px]" style={{ color: 'var(--muted-2)' }}>
            <span>{stats.visits14d[0]?.day.slice(5)}</span>
            <span>{stats.visits14d[stats.visits14d.length - 1]?.day.slice(5)}</span>
          </div>
        </section>

        <section className="card p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-extrabold">{t('adm.recent')}</h2>
            <button className="text-xs font-bold" style={{ color: 'var(--brand)' }} onClick={() => onTab('members')}>{t('common.viewAll')}</button>
          </div>
          <div className="mt-3 space-y-1">
            {stats.recent.map((member) => (
              <button key={member.id} onClick={() => onOpenMember(member.id)} className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-start hover:bg-[var(--surface-2)]">
                <span className="grid h-8 w-8 place-items-center rounded-full text-[10px] font-bold" style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}>{member.fullNameAr.slice(0, 2)}</span>
                <span className="min-w-0 flex-1"><span className="block truncate text-xs font-bold">{member.fullNameAr}</span><span className="block truncate text-[10px]" dir="ltr" style={{ color: 'var(--muted)' }}>{member.email}</span></span>
                <StatusBadge status={member.status} />
              </button>
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <a href="/api/admin/export.csv" className="card flex items-center gap-3 p-4" download>
          <span className="grid h-10 w-10 place-items-center rounded-xl" style={{ background: 'var(--gold-soft)', color: 'var(--gold)' }}><Download size={18} /></span>
          <span><span className="block text-sm font-bold">{t('adm.exportCsv')}</span><span className="block text-xs" style={{ color: 'var(--muted)' }}>{t('adm.exportCsvSub')}</span></span>
        </a>
        <button onClick={() => onTab('emails')} className="card flex items-center gap-3 p-4 text-start">
          <span className="grid h-10 w-10 place-items-center rounded-xl" style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}><Mail size={18} /></span>
          <span><span className="block text-sm font-bold">{t('adm.emailsTitle')}</span><span className="block text-xs" style={{ color: 'var(--muted)' }}>{t('adm.emailsSub')}</span></span>
        </button>
      </div>
    </div>
  );
}

function Members({ refreshKey, onOpenMember }: { refreshKey: number; onOpenMember: (id: number) => void }) {
  const { t, formatNumber } = useI18n();
  const { toast } = useToast();
  const [qInput, setQInput] = useState('');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ items: AdminMember[]; total: number; page: number; pages: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQ(qInput.trim());
      setPage(1);
    }, 320);
    return () => window.clearTimeout(timer);
  }, [qInput]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (status) params.set('status', status);
    params.set('page', String(page));
    api<{ items: AdminMember[]; total: number; page: number; pages: number }>(`/admin/members?${params.toString()}`)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled) toast(getErrorMessage(err, t), 'error');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [q, status, page, refreshKey, t, toast]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold sm:text-3xl">{t('adm.members')}</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>{t('adm.sub')}</p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search size={17} className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 opacity-50" />
          <input className="input ps-11" value={qInput} onChange={(e) => setQInput(e.target.value)} placeholder={t('adm.searchMembers')} />
        </div>
        <div className="relative sm:w-48">
          <Filter size={15} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 opacity-50" />
          <select className="input ps-9" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">{t('adm.allStatuses')}</option>
            <option value="pending">{t('common.pending')}</option>
            <option value="approved">{t('common.approved')}</option>
            <option value="rejected">{t('common.rejected')}</option>
            <option value="suspended">{t('common.suspended')}</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-16" />)}</div>
      ) : !data?.items.length ? (
        <EmptyState icon={Users} title={t('adm.noMembers')} />
      ) : (
        <>
          <div className="card overflow-hidden">
            <div className="hidden grid-cols-[2fr_1fr_1fr_0.7fr_0.5fr] gap-3 border-b px-4 py-3 text-[11px] font-bold uppercase tracking-wider md:grid" style={{ borderColor: 'var(--line)', color: 'var(--muted-2)' }}>
              <span>{t('common.name')}</span><span>{t('common.specialty')}</span><span>{t('common.email')}</span><span>{t('adm.status')}</span><span />
            </div>
            <div className="divide-y" style={{ borderColor: 'var(--line)' }}>
              {data.items.map((member) => (
                <button key={member.id} onClick={() => onOpenMember(member.id)} className="grid w-full grid-cols-1 gap-2 p-3 text-start transition-colors hover:bg-[var(--surface-2)] md:grid-cols-[2fr_1fr_1fr_0.7fr_0.5fr] md:items-center md:gap-3 md:px-4">
                  <span className="flex min-w-0 items-center gap-2.5">
                    <img src={avatarUrl(member.avatarKey)} alt="" className="h-10 w-10 shrink-0 rounded-xl object-cover" />
                    <span className="min-w-0"><span className="block truncate text-sm font-bold">{member.fullNameAr}</span><span className="block truncate text-[11px]" dir="ltr" style={{ color: 'var(--muted)' }}>ksa.doctor/{member.handle}</span></span>
                  </span>
                  <span className="truncate text-xs" style={{ color: 'var(--muted)' }}>{member.specialtyAr || '—'}</span>
                  <span className="truncate text-xs" dir="ltr" style={{ color: 'var(--muted)' }}>{member.email}</span>
                  <span><StatusBadge status={member.status} /></span>
                  <span className="hidden justify-end md:flex"><ChevronLeft size={16} className="opacity-40 rtl:rotate-180" /></span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs" style={{ color: 'var(--muted)' }}>{t('adm.showing', { from: formatNumber((data.page - 1) * 20 + 1), to: formatNumber(Math.min(data.page * 20, data.total)), total: formatNumber(data.total) })}</span>
            <div className="flex gap-2">
              <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}><ChevronRight size={15} className="rtl:hidden" /><ChevronLeft size={15} className="hidden rtl:block" /> {t('common.previous')}</button>
              <button className="btn btn-ghost btn-sm" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>{t('common.next')} <ChevronLeft size={15} className="rtl:hidden" /><ChevronRight size={15} className="hidden rtl:block" /></button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function MemberModal({ id, onClose, onChanged }: { id: number; onClose: () => void; onChanged: () => void }) {
  const { t, formatNumber, formatDate } = useI18n();
  const { toast } = useToast();
  const [member, setMember] = useState<UserPrivate | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');

  const load = () => {
    setLoading(true);
    api<{ member: UserPrivate }>(`/admin/members/${id}`)
      .then((res) => setMember(res.member))
      .catch((err) => toast(getErrorMessage(err, t), 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const act = async (action: string, body?: unknown, confirmText?: string) => {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusy(action);
    try {
      await api(`/admin/members/${id}/${action}`, { method: 'POST', body: body ? JSON.stringify(body) : undefined });
      toast(t(`adm.${action === 'feature' ? 'featureSuccess' : action === 'visibility' ? 'hideSuccess' : `${action}Success`}`), 'success');
      setRejecting(false);
      setReason('');
      onChanged();
      load();
    } catch (err) {
      toast(getErrorMessage(err, t), 'error');
    } finally {
      setBusy('');
    }
  };

  const submitReject = async () => {
    if (reason.trim().length < 3) {
      toast(t('adm.reasonRequired'), 'error');
      return;
    }
    await act('reject', { reason: reason.trim() });
  };

  return (
    <Modal open onClose={onClose} title={t('adm.memberDetails')} subtitle={member ? `ksa.doctor/${member.handle}` : undefined} size="lg">
      {loading ? (
        <div className="space-y-3"><div className="skeleton h-24" /><div className="skeleton h-40" /></div>
      ) : !member ? (
        <EmptyState icon={AlertTriangle} title={t('common.error')} action={<button className="btn btn-ghost" onClick={load}>{t('common.retry')}</button>} />
      ) : (
        <div className="space-y-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <img src={avatarUrl(member.avatarKey)} alt="" className="h-20 w-20 rounded-2xl object-cover ring-2 ring-[var(--gold)]/40" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5"><StatusBadge status={member.status} /><span className="badge">{member.memberNo}</span>{member.featured && <span className="badge badge-gold"><Star size={11} /> {t('common.featured')}</span>}</div>
              <h2 className="mt-1 truncate text-xl font-extrabold">{member.fullNameAr}</h2>
              <p className="truncate text-sm" style={{ color: 'var(--muted)' }}>{member.specialtyAr || '—'}{member.city && CITY_MAP[member.city] ? ` · ${CITY_MAP[member.city].ar}` : ''}</p>
              <p className="truncate text-xs" dir="ltr" style={{ color: 'var(--muted-2)' }}>{member.email}</p>
            </div>
            <Link to={`/${member.handle}`} target="_blank" className="btn btn-ghost btn-sm shrink-0"><ArrowUpRight size={15} /> {t('adm.view')}</Link>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
            <div className="rounded-xl border p-3" style={{ borderColor: 'var(--line)' }}><p style={{ color: 'var(--muted)' }}>{t('adm.statsViews')}</p><p className="mt-1 text-base font-extrabold">{formatNumber(member.views)}</p></div>
            <div className="rounded-xl border p-3" style={{ borderColor: 'var(--line)' }}><p style={{ color: 'var(--muted)' }}>{t('dash.completion')}</p><p className="mt-1 text-base font-extrabold">{formatNumber(member.profileCompletion)}%</p></div>
            <div className="rounded-xl border p-3" style={{ borderColor: 'var(--line)' }}><p style={{ color: 'var(--muted)' }}>{t('dash.joinedAt')}</p><p className="mt-1 font-bold">{formatDate(member.createdAt)}</p></div>
            <div className="rounded-xl border p-3" style={{ borderColor: 'var(--line)' }}><p style={{ color: 'var(--muted)' }}>{t('dash.lastLogin')}</p><p className="mt-1 font-bold">{formatDate(member.lastLoginAt, true)}</p></div>
          </div>

          {member.bioAr && <p className="rounded-xl border p-3 text-xs leading-6" style={{ borderColor: 'var(--line)', color: 'var(--muted)' }}>{member.bioAr}</p>}
          {member.rejectionReason && (
            <div className="rounded-xl border p-3 text-xs" style={{ borderColor: 'var(--danger)', background: 'var(--danger-soft)' }}>
              <span className="font-bold">{t('adm.rejectReason')}: </span>{member.rejectionReason}
            </div>
          )}

          {rejecting ? (
            <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--danger)', background: 'var(--danger-soft)' }}>
              <h3 className="text-sm font-extrabold">{t('adm.rejectTitle')}</h3>
              <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>{t('adm.rejectSub')}</p>
              <textarea className="input mt-3 min-h-24" value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t('adm.rejectReason')} maxLength={500} />
              <div className="mt-2 flex justify-end gap-2">
                <button className="btn btn-ghost btn-sm" onClick={() => setRejecting(false)}>{t('common.cancel')}</button>
                <button className="btn btn-danger btn-sm" onClick={submitReject} disabled={busy === 'reject'}>{busy === 'reject' ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} {t('adm.rejectConfirm')}</button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 border-t pt-4" style={{ borderColor: 'var(--line)' }}>
              {member.status === 'pending' && (
                <>
                  <button className="btn btn-primary btn-sm" onClick={() => act('approve', undefined, t('adm.approveConfirm'))} disabled={!!busy}>{busy === 'approve' ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={15} />} {t('adm.approve')}</button>
                  <button className="btn btn-danger btn-sm" onClick={() => setRejecting(true)} disabled={!!busy}><XCircle size={15} /> {t('adm.reject')}</button>
                </>
              )}
              {member.status === 'approved' && (
                <>
                  <button className="btn btn-ghost btn-sm" onClick={() => act('feature', undefined, t('adm.feature'))} disabled={!!busy}>{busy === 'feature' ? <Loader2 size={14} className="animate-spin" /> : <Star size={15} />} {member.featured ? t('adm.unfeature') : t('adm.feature')}</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => act('visibility', undefined, t('adm.hide'))} disabled={!!busy}><EyeOff size={15} /> {t('adm.hide')} / {t('adm.show')}</button>
                  <button className="btn btn-danger btn-sm" onClick={() => act('suspend', undefined, t('adm.suspendConfirm'))} disabled={!!busy}><Ban size={15} /> {t('adm.suspend')}</button>
                </>
              )}
              {member.status === 'suspended' && <button className="btn btn-primary btn-sm" onClick={() => act('restore', undefined, t('adm.restoreConfirm'))} disabled={!!busy}><RotateCcw size={15} /> {t('adm.restore')}</button>}
              {(member.status === 'rejected' || member.status === 'suspended') && <button className="btn btn-ghost btn-sm" onClick={() => act('approve', undefined, t('adm.approveConfirm'))} disabled={!!busy}><CheckCircle2 size={15} /> {t('adm.approve')}</button>}
              {member.status !== 'pending' && <button className="btn btn-ghost btn-sm" onClick={() => setRejecting(true)} disabled={!!busy}><XCircle size={15} /> {t('adm.reject')}</button>}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

function SettingsPanel() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [form, setForm] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api<{ settings: Settings }>('/admin/settings').then((res) => setForm(res.settings)).catch((err) => toast(getErrorMessage(err, t), 'error'));
  }, [t, toast]);

  const save = async () => {
    if (!form) return;
    setSaving(true);
    try {
      const res = await api<{ settings: Settings }>('/admin/settings', { method: 'PUT', body: JSON.stringify(form) });
      setForm(res.settings);
      toast(t('adm.settingsSaved'), 'success');
    } catch (err) {
      toast(getErrorMessage(err, t), 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!form) return <div className="skeleton h-72" />;

  return (
    <div className="max-w-2xl space-y-4">
      <div><h1 className="text-2xl font-extrabold sm:text-3xl">{t('adm.settingsTitle')}</h1><p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>{t('adm.settingsSub')}</p></div>
      <section className="card space-y-5 p-5">
        <div className="flex items-center justify-between gap-3">
          <div><p className="text-sm font-bold">{t('adm.registrationOpen')}</p><p className="text-xs" style={{ color: 'var(--muted)' }}>{t('adm.registrationOpenSub')}</p></div>
          <button role="switch" aria-checked={form.registrationOpen} onClick={() => setForm({ ...form, registrationOpen: !form.registrationOpen })} className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${form.registrationOpen ? 'bg-[var(--brand)]' : 'bg-[var(--line-strong)]'}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${form.registrationOpen ? 'start-6' : 'start-1'}`} /></button>
        </div>
        <div className="flex items-center justify-between gap-3 border-t pt-4" style={{ borderColor: 'var(--line)' }}>
          <div><p className="text-sm font-bold">{t('adm.adminNotify')}</p><p className="text-xs" style={{ color: 'var(--muted)' }}>{t('adm.adminNotifySub')}</p></div>
          <button role="switch" aria-checked={form.adminNotify} onClick={() => setForm({ ...form, adminNotify: !form.adminNotify })} className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${form.adminNotify ? 'bg-[var(--brand)]' : 'bg-[var(--line-strong)]'}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${form.adminNotify ? 'start-6' : 'start-1'}`} /></button>
        </div>
        <label className="block border-t pt-4" style={{ borderColor: 'var(--line)' }}><span className="field-label">{t('adm.announcementAr')}</span><textarea className="input min-h-20" value={form.announcementAr} onChange={(e) => setForm({ ...form, announcementAr: e.target.value })} maxLength={300} /></label>
        <label className="block"><span className="field-label">{t('adm.announcementEn')}</span><textarea className="input min-h-20" value={form.announcementEn} onChange={(e) => setForm({ ...form, announcementEn: e.target.value })} maxLength={300} dir="ltr" /></label>
        <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? <Loader2 size={16} className="animate-spin" /> : <Settings2 size={16} />} {t('adm.saveSettings')}</button>
      </section>
    </div>
  );
}

function Audit() {
  const { t, formatDate } = useI18n();
  const { toast } = useToast();
  const [items, setItems] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ items: AuditRow[] }>('/admin/audit')
      .then((res) => setItems(res.items))
      .catch((err) => toast(getErrorMessage(err, t), 'error'))
      .finally(() => setLoading(false));
  }, [t, toast]);

  return (
    <div className="space-y-4">
      <div><h1 className="text-2xl font-extrabold sm:text-3xl">{t('adm.auditTitle')}</h1><p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>{t('adm.auditSub')}</p></div>
      {loading ? <div className="skeleton h-64" /> : items.length === 0 ? <EmptyState icon={ScrollText} title={t('adm.noAudit')} /> : (
        <div className="card divide-y overflow-hidden" style={{ borderColor: 'var(--line)' }}>
          {items.map((item) => (
            <div key={item.id} className="flex items-start gap-3 p-3 text-xs sm:items-center sm:px-4">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg" style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}><Activity size={15} /></span>
              <span className="min-w-0 flex-1"><span className="block font-bold">{item.action}</span><span className="block truncate" style={{ color: 'var(--muted)' }}>{item.actor_name || '—'} · {item.target_type}/{item.target_id}</span></span>
              <span className="shrink-0 text-[10px]" style={{ color: 'var(--muted-2)' }}>{formatDate(item.created_at, true)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Emails() {
  const { t, formatDate } = useI18n();
  const { toast } = useToast();
  const [items, setItems] = useState<EmailRow[]>([]);
  const [configured, setConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | 'test' | null>(null);

  const load = () => {
    setLoading(true);
    api<{ items: EmailRow[]; resendConfigured: boolean }>('/admin/emails')
      .then((res) => { setItems(res.items); setConfigured(res.resendConfigured); })
      .catch((err) => toast(getErrorMessage(err, t), 'error'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const retry = async (id: number) => {
    setBusy(id);
    try {
      await api(`/admin/emails/${id}/retry`, { method: 'POST' });
      toast(t('common.success'), 'success');
      load();
    } catch (err) {
      toast(getErrorMessage(err, t), 'error');
    } finally {
      setBusy(null);
    }
  };

  const test = async () => {
    setBusy('test');
    try {
      await api('/admin/emails/test', { method: 'POST' });
      toast(t('adm.testEmailSent'), 'success');
      load();
    } catch (err) {
      toast(getErrorMessage(err, t), 'error');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-2xl font-extrabold sm:text-3xl">{t('adm.emailsTitle')}</h1><p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>{t('adm.emailsSub')}</p></div>
        <button className="btn btn-primary btn-sm" onClick={test} disabled={!configured || busy === 'test'}>{busy === 'test' ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} {t('adm.testEmail')}</button>
      </div>
      <div className={`flex items-start gap-3 rounded-2xl border p-4 text-sm ${configured ? '' : ''}`} style={{ borderColor: configured ? 'var(--ok)' : 'var(--warn)', background: configured ? 'var(--ok-soft)' : 'var(--warn-soft)' }}>
        {configured ? <CheckCircle2 size={19} className="mt-0.5 shrink-0" style={{ color: 'var(--ok)' }} /> : <AlertTriangle size={19} className="mt-0.5 shrink-0" style={{ color: 'var(--warn)' }} />}
        <div><p className="font-bold">{configured ? t('adm.resendConfigured') : t('adm.resendMissing')}</p>{!configured && <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>{t('adm.resendMissingBody')}</p>}</div>
      </div>
      {loading ? <div className="skeleton h-64" /> : items.length === 0 ? <EmptyState icon={Mail} title={t('adm.noEmails')} /> : (
        <div className="card overflow-hidden">
          <div className="hidden grid-cols-[1.4fr_0.8fr_0.8fr_0.6fr_0.5fr] gap-3 border-b px-4 py-3 text-[11px] font-bold uppercase tracking-wider md:grid" style={{ borderColor: 'var(--line)', color: 'var(--muted-2)' }}>
            <span>{t('adm.emailTo')}</span><span>{t('adm.emailTemplate')}</span><span>{t('adm.emailDate')}</span><span>{t('adm.emailStatus')}</span><span />
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--line)' }}>
            {items.map((email) => (
              <div key={email.id} className="grid grid-cols-1 gap-1 p-3 text-xs md:grid-cols-[1.4fr_0.8fr_0.8fr_0.6fr_0.5fr] md:items-center md:gap-3 md:px-4">
                <span className="truncate font-bold" dir="ltr">{email.to_email}</span>
                <span className="truncate" style={{ color: 'var(--muted)' }}>{email.template}</span>
                <span className="text-[10px]" style={{ color: 'var(--muted-2)' }}>{formatDate(email.created_at, true)}</span>
                <span><span className={`badge ${email.status === 'sent' ? 'badge-ok' : email.status === 'failed' ? 'badge-danger' : 'badge-warn'}`}>{email.status}</span></span>
                <span className="md:text-end">
                  {email.status !== 'sent' && <button className="btn btn-ghost btn-sm" onClick={() => retry(email.id)} disabled={!configured || busy === email.id}>{busy === email.id ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />} {t('adm.retryEmail')}</button>}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
